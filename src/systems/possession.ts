/**
 * Ball Possession System
 *
 * Pure TypeScript — no framework dependencies.
 * Manages who has the ball, dribble position, tackles, passing, and shooting.
 */

// ─── Types ──────────────────────────────────────────────────────
export type PossessorType = 'player' | 'player-2' | 'home-ai' | 'away-ai'

export interface Possessor {
  type: PossessorType
  index: number
  facingAngle: number
}

export interface PossessionState {
  possessor: Possessor | null
  pickupCooldownUntil: number
  lastPossessorType: PossessorType | null
  lastPossessorIndex: number
}

// ─── Constants ──────────────────────────────────────────────────
export const POSSESSION = {
  PICKUP_RADIUS: 2.0,
  PICKUP_COOLDOWN_MS: 200,
  DRIBBLE_FORWARD: 0.7,
  DRIBBLE_HEIGHT: 0.22,
  DRIBBLE_WOBBLE_AMP: 0.08,
  DRIBBLE_WOBBLE_FREQ: 6,
  MIN_SHOOT_FORCE: 20,
  MAX_SHOOT_FORCE: 45,
  CHARGE_SPEED: 4,
  SHOOT_LIFT: 6.0,
  PASS_FORCE: 18,
  PASS_LIFT: 2.0,
  AI_SHOOT_FORCE: 32,
  AI_PASS_FORCE: 24,
  TACKLE_RADIUS: 1.2,
  TACKLE_PROB: 0.03,
  TACKLE_COOLDOWN_MS: 600,
  AI_SHOOT_DIST: 20,
  AI_SHOOT_PROB: 0.015,
  AI_PASS_PROB: 0.008,
  AI_MIN_DRIBBLE: 15,
} as const

// ─── State Factory ──────────────────────────────────────────────
export function createPossessionState(): PossessionState {
  return {
    possessor: null,
    pickupCooldownUntil: 0,
    lastPossessorType: null,
    lastPossessorIndex: -1,
  }
}

// ─── Pickup Logic ───────────────────────────────────────────────
export function canPickup(
  state: PossessionState,
  _type: PossessorType,
  _index: number,
  now: number,
): boolean {
  if (state.possessor !== null) return false
  // During cooldown after a kick/pass, block ALL entities so the ball
  // has time to travel before anyone can pick it up again.
  if (now < state.pickupCooldownUntil) return false
  return true
}

// ─── Dribble Position ───────────────────────────────────────────
export function getDribblePosition(
  x: number,
  z: number,
  facingAngle: number,
  elapsedTime: number,
  isMoving: boolean,
): { x: number; y: number; z: number } {
  const forwardX = -Math.sin(facingAngle) * POSSESSION.DRIBBLE_FORWARD
  const forwardZ = -Math.cos(facingAngle) * POSSESSION.DRIBBLE_FORWARD

  let wobbleX = 0
  let wobbleZ = 0
  if (isMoving) {
    const wobble = Math.sin(elapsedTime * POSSESSION.DRIBBLE_WOBBLE_FREQ * Math.PI * 2) * POSSESSION.DRIBBLE_WOBBLE_AMP
    // Wobble perpendicular to facing direction
    wobbleX = Math.cos(facingAngle) * wobble
    wobbleZ = -Math.sin(facingAngle) * wobble
  }

  return {
    x: x + forwardX + wobbleX,
    y: POSSESSION.DRIBBLE_HEIGHT,
    z: z + forwardZ + wobbleZ,
  }
}

// ─── Tackle Detection ───────────────────────────────────────────
export function findTackler(
  ballX: number,
  ballZ: number,
  opponentPositions: { x: number; z: number }[],
  tackleRadius: number,
): number {
  let closestIdx = -1
  let closestDist = Infinity
  for (let i = 0; i < opponentPositions.length; i++) {
    const op = opponentPositions[i]
    const dx = ballX - op.x
    const dz = ballZ - op.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < tackleRadius && dist < closestDist) {
      closestDist = dist
      closestIdx = i
    }
  }
  return closestIdx
}

// ─── Pass Target ────────────────────────────────────────────────
export function findPassTarget(
  fromX: number,
  fromZ: number,
  facingAngle: number,
  teammatePositions: { x: number; z: number }[],
): number {
  const faceDirX = -Math.sin(facingAngle)
  const faceDirZ = -Math.cos(facingAngle)

  let bestIndex = -1
  let bestDist = Infinity

  for (let i = 0; i < teammatePositions.length; i++) {
    const tm = teammatePositions[i]
    const dx = tm.x - fromX
    const dz = tm.z - fromZ
    // Dot product to check if teammate is in front
    const dot = dx * faceDirX + dz * faceDirZ
    if (dot > 0) {
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < bestDist) {
        bestDist = dist
        bestIndex = i
      }
    }
  }

  return bestIndex
}

// ─── Direction Helpers ──────────────────────────────────────────
export function getDirectionTo(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
): { x: number; z: number } {
  const dx = toX - fromX
  const dz = toZ - fromZ
  const dist = Math.sqrt(dx * dx + dz * dz)
  if (dist < 0.001) return { x: 0, z: 0 }
  return { x: dx / dist, z: dz / dist }
}

export function getShootDirection(
  fromX: number,
  fromZ: number,
  goalZ: number,
  goalWidth: number,
  spreadRandom: number = Math.random(),
): { x: number; z: number } {
  // Aim at goal center with slight random spread
  const spread = (spreadRandom - 0.5) * goalWidth * 0.6
  const targetX = spread
  const targetZ = goalZ
  return getDirectionTo(fromX, fromZ, targetX, targetZ)
}
