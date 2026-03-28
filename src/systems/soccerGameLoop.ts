/**
 * Soccer Game Loop Utilities
 *
 * Pure functions extracted from SoccerMatch.tsx's 740-line useFrame.
 * Returns action descriptors — never calls side effects directly.
 * The caller (SoccerMatch.tsx) remains the side-effect boundary
 * (plays audio, calls releaseBall, updates stores).
 *
 * Follows the project pattern: pure TypeScript systems like possession.ts, soccerAI.ts.
 */

import type { Vec3, SoccerAIRole } from './soccerAI'
import type { PossessorType, PossessionState } from './possession'
import type { PossessionTeam, MatchContext } from './soccerDecisions'
import type { Difficulty } from '@/types'
import type { AnimationState } from '@/components/HytopiaAvatar'
import {
  canPickup,
  findPassTarget,
  getDirectionTo,
  getShootDirection,
  POSSESSION,
} from './possession'
import {
  getRoleHomePosition,
  getRepulsionOffset,
} from './soccerAI'
import {
  getAIDecision,
  getShootProbability,
  getPassProbability,
} from './soccerDecisions'
import { Vec3Pool } from '@/utils/vec3Pool'

// Module-level pool — reset at start of each updateTeamAI call
const _teamAIPool = new Vec3Pool()

// Pre-allocated candidate arrays — reused each frame to avoid GC pressure
const _tackleCandidates: TackleCandidate[] = []
const _pickupCandidates: PickupCandidate[] = []

export const TACKLE_PROB_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 0.008,    // ~40% chance per second — very forgiving
  medium: 0.015,  // ~60% chance per second — moderate
  hard: 0.028,    // ~82% chance per second — challenging (close to original)
}

// ─── Charge / Shoot ─────────────────────────────────────────────

export interface ChargeState {
  charging: boolean
  chargeStartTime: number
  shootPower: number
}

export type ChargeAction =
  | { type: 'none' }
  | { type: 'start'; power: number }
  | { type: 'update'; power: number }
  | { type: 'shoot'; dirX: number; dirZ: number; power: number; lift: number }
  | { type: 'cancel' }

/**
 * Process charge-shoot cycle for a player (P1 or P2).
 * Returns an action descriptor — caller handles audio + releaseBall.
 *
 * @param charge - current charge state (mutated in-place for perf)
 * @param hasBall - whether this player currently possesses the ball
 * @param buttonDown - whether the shoot button is currently held
 * @param ballX - ball X position (for shoot direction)
 * @param ballZ - ball Z position (for shoot direction)
 * @param goalZ - Z coordinate of the goal this player attacks
 * @param goalWidth - width of the goal
 * @param nowSeconds - performance.now() / 1000
 */
export function processChargeShoot(
  charge: ChargeState,
  hasBall: boolean,
  buttonDown: boolean,
  ballX: number,
  ballZ: number,
  goalZ: number,
  goalWidth: number,
  nowSeconds: number,
): ChargeAction {
  // Cancel charge on possession loss
  if (charge.charging && !hasBall) {
    charge.charging = false
    charge.chargeStartTime = 0
    charge.shootPower = 0
    return { type: 'cancel' }
  }

  // Start charging on button press
  if (buttonDown && !charge.charging && hasBall) {
    charge.charging = true
    charge.chargeStartTime = nowSeconds
    charge.shootPower = POSSESSION.MIN_SHOOT_FORCE
    return { type: 'start', power: POSSESSION.MIN_SHOOT_FORCE }
  }

  // Oscillate power while holding
  if (charge.charging && buttonDown && hasBall) {
    const t = nowSeconds - charge.chargeStartTime
    const norm = (Math.sin(t * POSSESSION.CHARGE_SPEED) + 1) / 2
    const power = POSSESSION.MIN_SHOOT_FORCE + norm * (POSSESSION.MAX_SHOOT_FORCE - POSSESSION.MIN_SHOOT_FORCE)
    charge.shootPower = power
    return { type: 'update', power }
  }

  // Release shot when button released (was charging)
  if (charge.charging && !buttonDown && hasBall) {
    const dir = getShootDirection(ballX, ballZ, goalZ, goalWidth)
    const power = charge.shootPower || POSSESSION.MIN_SHOOT_FORCE
    charge.charging = false
    charge.chargeStartTime = 0
    charge.shootPower = 0
    return { type: 'shoot', dirX: dir.x, dirZ: dir.z, power, lift: POSSESSION.SHOOT_LIFT }
  }

  return { type: 'none' }
}

// ─── Pass ───────────────────────────────────────────────────────

export interface PassAction {
  type: 'none' | 'pass'
  dirX?: number
  dirZ?: number
  force?: number
  lift?: number
  targetTeam?: 'home' | 'away'
  targetIndex?: number
  targetPos?: Vec3
}

// Module-level no-op sentinel — avoids allocating a new object on every early return
const PASS_NONE: PassAction = { type: 'none' }

/**
 * Process instant pass for a player.
 * Returns a pass action descriptor — caller handles audio + releaseBall.
 *
 * @param hasBall - whether this player currently possesses the ball
 * @param buttonPressed - whether the pass button was just pressed (one-shot)
 * @param fromX - player X position
 * @param fromZ - player Z position
 * @param facingAngle - player facing angle
 * @param team - which team the player is on
 * @param teammates - array of teammate positions (AI only, same team)
 */
export function processPass(
  hasBall: boolean,
  buttonPressed: boolean,
  fromX: number,
  fromZ: number,
  facingAngle: number,
  team: 'home' | 'away',
  teammates: { x: number; z: number }[],
): PassAction {
  if (!buttonPressed || !hasBall) return PASS_NONE

  const targetIdx = findPassTarget(fromX, fromZ, facingAngle, teammates)
  if (targetIdx < 0) return PASS_NONE

  const tm = teammates[targetIdx]
  const dir = getDirectionTo(fromX, fromZ, tm.x, tm.z)
  return {
    type: 'pass',
    dirX: dir.x,
    dirZ: dir.z,
    force: POSSESSION.PASS_FORCE,
    lift: POSSESSION.PASS_LIFT,
    targetTeam: team,
    targetIndex: targetIdx,
    targetPos: { x: tm.x, y: 0, z: tm.z },
  }
}

// ─── Tackle ─────────────────────────────────────────────────────

export interface TackleCandidate {
  type: PossessorType
  index: number
  x: number
  z: number
  facingAngle: number
}

export interface TackleResult {
  tackled: boolean
  newPossessor?: {
    type: PossessorType
    index: number
    facingAngle: number
  }
}

/**
 * Build the list of candidates who can attempt a tackle on the current ball holder.
 * Opponents of the possessor are candidates.
 *
 * @param possessorIsOnHome - whether the possessor is on the home team
 * @param possessorIsOnAway - whether the possessor is on the away team
 * @param homePosFlat - home AI positions
 * @param awayPosFlat - away AI positions
 * @param p1Pos - player 1 position
 * @param p1Facing - player 1 facing angle
 * @param player1Team - which team P1 is on
 * @param playerCount - 1 or 2
 * @param p2Pos - player 2 position (if exists)
 * @param p2Facing - player 2 facing angle
 * @param player2Team - which team P2 is on
 */
export function buildTackleCandidates(
  possessorIsOnHome: boolean,
  possessorIsOnAway: boolean,
  homePosFlat: Vec3[],
  awayPosFlat: Vec3[],
  p1Pos: { x: number; z: number },
  p1Facing: number,
  player1Team: 'home' | 'away',
  playerCount: number,
  p2Pos: { x: number; z: number },
  p2Facing: number,
  player2Team: 'home' | 'away',
): TackleCandidate[] {
  // Reuse module-level array to avoid per-frame allocation
  _tackleCandidates.length = 0

  if (possessorIsOnHome) {
    // Away team AI tries to tackle
    for (let i = 0; i < awayPosFlat.length; i++) {
      _tackleCandidates.push({ type: 'away-ai', index: i, x: awayPosFlat[i].x, z: awayPosFlat[i].z, facingAngle: 0 })
    }
    // P1 tackles if on away team
    if (player1Team === 'away') {
      _tackleCandidates.push({ type: 'player', index: 0, x: p1Pos.x, z: p1Pos.z, facingAngle: p1Facing })
    }
    // P2 tackles if on away team
    if (playerCount === 2 && player2Team === 'away') {
      _tackleCandidates.push({ type: 'player-2', index: 0, x: p2Pos.x, z: p2Pos.z, facingAngle: p2Facing })
    }
  } else if (possessorIsOnAway) {
    // Home team AI tries to tackle
    for (let i = 0; i < homePosFlat.length; i++) {
      _tackleCandidates.push({ type: 'home-ai', index: i, x: homePosFlat[i].x, z: homePosFlat[i].z, facingAngle: 0 })
    }
    // P1 tackles if on the opposing (home) team
    if (player1Team === 'home') {
      _tackleCandidates.push({ type: 'player', index: 0, x: p1Pos.x, z: p1Pos.z, facingAngle: p1Facing })
    }
    // P2 tackles if on home team
    if (playerCount === 2 && player2Team === 'home') {
      _tackleCandidates.push({ type: 'player-2', index: 0, x: p2Pos.x, z: p2Pos.z, facingAngle: p2Facing })
    }
  }

  return _tackleCandidates
}

/**
 * Check if any tackle candidate can steal the ball.
 * Returns the first successful tackle (closest within radius, then probability check).
 *
 * @param dribbleX - ball dribble X position
 * @param dribbleZ - ball dribble Z position
 * @param candidates - tackle candidates
 * @param randomValue - pre-computed random for deterministic testing
 */
export function processTackles(
  dribbleX: number,
  dribbleZ: number,
  candidates: TackleCandidate[],
  tackleProbability: number = POSSESSION.TACKLE_PROB,
  randomValue: number = Math.random(),
): TackleResult {
  // For AI candidates, use findTackler to get the closest one
  // For player candidates, check distance directly
  let closestIdx = -1
  let closestDist = Infinity

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const dx = dribbleX - c.x
    const dz = dribbleZ - c.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < POSSESSION.TACKLE_RADIUS && dist < closestDist) {
      closestDist = dist
      closestIdx = i
    }
  }

  if (closestIdx >= 0 && randomValue < tackleProbability) {
    const c = candidates[closestIdx]
    return {
      tackled: true,
      newPossessor: { type: c.type, index: c.index, facingAngle: c.facingAngle },
    }
  }

  return { tackled: false }
}

// ─── Pickup ─────────────────────────────────────────────────────

export interface PickupCandidate {
  type: PossessorType
  index: number
  x: number
  z: number
  facingAngle: number
}

export interface PickupResult {
  pickedUp: boolean
  newPossessor?: {
    type: PossessorType
    index: number
    facingAngle: number
  }
}

/**
 * Build the list of candidates who can pick up a loose ball.
 * Order matters: P1 first, then P2, then home AI, then away AI.
 */
export function buildPickupCandidates(
  p1Pos: { x: number; z: number },
  p1Facing: number,
  playerCount: number,
  p2Pos: { x: number; z: number },
  p2Facing: number,
  homePosFlat: Vec3[],
  awayPosFlat: Vec3[],
): PickupCandidate[] {
  // Reuse module-level array to avoid per-frame allocation
  _pickupCandidates.length = 0

  // P1
  _pickupCandidates.push({ type: 'player', index: 0, x: p1Pos.x, z: p1Pos.z, facingAngle: p1Facing })

  // P2
  if (playerCount === 2) {
    _pickupCandidates.push({ type: 'player-2', index: 0, x: p2Pos.x, z: p2Pos.z, facingAngle: p2Facing })
  }

  // Home AI
  for (let i = 0; i < homePosFlat.length; i++) {
    _pickupCandidates.push({ type: 'home-ai', index: i, x: homePosFlat[i].x, z: homePosFlat[i].z, facingAngle: 0 })
  }

  // Away AI
  for (let i = 0; i < awayPosFlat.length; i++) {
    _pickupCandidates.push({ type: 'away-ai', index: i, x: awayPosFlat[i].x, z: awayPosFlat[i].z, facingAngle: 0 })
  }

  return _pickupCandidates
}

/**
 * Check if any candidate can pick up the loose ball.
 * First candidate within radius + past cooldown wins.
 */
export function processPickups(
  ballX: number,
  ballZ: number,
  candidates: PickupCandidate[],
  possessionState: PossessionState,
  now: number,
): PickupResult {
  for (const c of candidates) {
    const dx = ballX - c.x
    const dz = ballZ - c.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < POSSESSION.PICKUP_RADIUS && canPickup(possessionState, c.type, c.index, now)) {
      return {
        pickedUp: true,
        newPossessor: { type: c.type, index: c.index, facingAngle: c.facingAngle },
      }
    }
  }
  return { pickedUp: false }
}

// ─── AI Possession (shoot/pass decisions) ───────────────────────

export type AIPossessionAction =
  | { type: 'none' }
  | { type: 'shoot'; dirX: number; dirZ: number; force: number; lift: number }
  | { type: 'pass'; dirX: number; dirZ: number; force: number; lift: number; targetTeam: 'home' | 'away'; targetIndex: number; targetPos: Vec3 }

/**
 * Decide what an AI possessor does after minimum dribble frames.
 * Returns action descriptor — caller handles audio + releaseBall.
 *
 * @param dribbleFrames - how many frames the AI has been dribbling
 * @param possessorIndex - index of the AI possessor in their team's array
 * @param possessorFacingAngle - facing angle of the possessor
 * @param team - 'home' or 'away'
 * @param aiFormation - the formation array for this team
 * @param ballX - ball X
 * @param ballZ - ball Z
 * @param fieldHalfLength - half field length
 * @param goalWidth - goal width
 * @param teammates - teammate positions for passing
 * @param aiPositions - this team's AI positions (for pass source)
 * @param shootRandom - pre-computed random for shoot probability
 * @param passRandom - pre-computed random for pass probability
 */
export function processAIPossession(
  dribbleFrames: number,
  possessorIndex: number,
  possessorFacingAngle: number,
  team: 'home' | 'away',
  aiFormation: SoccerAIRole[],
  ballX: number,
  ballZ: number,
  fieldHalfLength: number,
  goalWidth: number,
  teammates: Vec3[],
  aiPositions: Vec3[],
  shootRandom: number = Math.random(),
  passRandom: number = Math.random(),
): AIPossessionAction {
  if (dribbleFrames <= POSSESSION.AI_MIN_DRIBBLE) return { type: 'none' }

  const goalZ = team === 'home' ? -fieldHalfLength : fieldHalfLength
  const distToGoal = Math.abs(ballZ - goalZ)
  const aiRole = aiFormation[possessorIndex] || 'center-mid-1'

  const shootProb = getShootProbability(aiRole, distToGoal)
  if (shootProb > 0 && shootRandom < shootProb * 0.02) {
    const dir = getShootDirection(ballX, ballZ, goalZ, goalWidth)
    return { type: 'shoot', dirX: dir.x, dirZ: dir.z, force: POSSESSION.AI_SHOOT_FORCE, lift: POSSESSION.SHOOT_LIFT }
  }

  if (passRandom < getPassProbability(aiRole)) {
    const aiPos = aiPositions[possessorIndex]
    if (aiPos) {
      const passIdx = findPassTarget(aiPos.x, aiPos.z, possessorFacingAngle, teammates)
      if (passIdx >= 0) {
        const dir = getDirectionTo(aiPos.x, aiPos.z, teammates[passIdx].x, teammates[passIdx].z)
        return {
          type: 'pass',
          dirX: dir.x,
          dirZ: dir.z,
          force: POSSESSION.AI_PASS_FORCE,
          lift: POSSESSION.PASS_LIFT,
          targetTeam: team,
          targetIndex: passIdx,
          targetPos: { x: teammates[passIdx].x, y: 0, z: teammates[passIdx].z },
        }
      }
    }
  }

  return { type: 'none' }
}

// ─── Team AI Movement ───────────────────────────────────────────

export interface AIPlayerResult {
  position: [number, number, number]
  rotation: number
  animation: AnimationState
  facingAngle?: number  // Updated facing for possessor
}

export interface TeamAIConfig {
  team: 'home' | 'away'
  formation: SoccerAIRole[]
  aiPositions: Vec3[]
  aiFacings: number[]
  opponentAIPositions: Vec3[]
  ballPos: Vec3
  ballVelocity: Vec3
  possessionTeam: PossessionTeam
  possessorIndex: number
  possessor: { type: PossessorType; index: number; facingAngle: number } | null
  player1Team: 'home' | 'away'
  playerCount: number
  player2Team: 'home' | 'away'
  p1Vec: Vec3
  p2Vec: Vec3
  playerPos: Vec3
  fieldHalfWidth: number
  fieldHalfLength: number
  goalWidth: number
  passTarget: { team: 'home' | 'away'; index: number } | null
  hasPossession: boolean  // whether anyone currently has the ball
  delta: number
  aiSpeed: number
}

/**
 * Update a single team's AI positions and animations.
 * Replaces the duplicate home/away AI loops (~90 lines each).
 * Mutates aiPositions and aiFacings in-place for performance.
 * Returns the AIPlayerData array for rendering.
 */
export function updateTeamAI(config: TeamAIConfig): AIPlayerResult[] {
  const {
    team, formation, aiPositions, aiFacings, opponentAIPositions,
    ballPos, ballVelocity, possessionTeam, possessorIndex, possessor,
    player1Team, playerCount, player2Team, p1Vec, p2Vec, playerPos,
    fieldHalfWidth, fieldHalfLength, goalWidth,
    passTarget, hasPossession, delta, aiSpeed,
  } = config

  _teamAIPool.reset()

  const attackingPositiveZ = team === 'away'
  const results: AIPlayerResult[] = []

  for (let i = 0; i < formation.length; i++) {
    const role = formation[i]
    const homePos = getRoleHomePosition(role, fieldHalfWidth, fieldHalfLength, attackingPositiveZ)

    // Build teammate list including humans on same team (no filter/spread allocation)
    const teammatePosArr: Vec3[] = []
    for (let j = 0; j < aiPositions.length; j++) {
      if (j !== i) {
        teammatePosArr.push(_teamAIPool.get(aiPositions[j].x, aiPositions[j].y, aiPositions[j].z))
      }
    }
    if (player1Team === team) teammatePosArr.push(_teamAIPool.get(p1Vec.x, p1Vec.y, p1Vec.z))
    if (playerCount === 2 && player2Team === team) teammatePosArr.push(_teamAIPool.get(p2Vec.x, p2Vec.y, p2Vec.z))

    // Build opponent list including humans on opponent team (no spread allocation)
    const opponentPosArr: Vec3[] = []
    const opponentTeam = team === 'home' ? 'away' : 'home'
    for (let j = 0; j < opponentAIPositions.length; j++) {
      opponentPosArr.push(_teamAIPool.get(opponentAIPositions[j].x, opponentAIPositions[j].y, opponentAIPositions[j].z))
    }
    if (player1Team === opponentTeam) opponentPosArr.push(_teamAIPool.get(p1Vec.x, p1Vec.y, p1Vec.z))
    if (playerCount === 2 && player2Team === opponentTeam) opponentPosArr.push(_teamAIPool.get(p2Vec.x, p2Vec.y, p2Vec.z))

    const matchCtx: MatchContext = {
      ballPos,
      ballVelocity,
      possession: possessionTeam,
      possessorIndex,
      myPos: aiPositions[i] || homePos,
      myRole: role,
      myIndex: i,
      myTeam: team,
      teammatePositions: teammatePosArr,
      opponentPositions: opponentPosArr,
      playerPos,
      attackingPositiveZ,
      fieldHalfWidth,
      fieldHalfLength,
      goalWidth,
      playerTeam: player1Team,
      player2Team: playerCount === 2 ? player2Team : undefined,
    }

    const decision = getAIDecision(matchCtx)
    let target = decision.target
    let speedMul = decision.speed

    const repulsionTeammates: Vec3[] = []
    for (let j = 0; j < aiPositions.length; j++) {
      if (j !== i) {
        repulsionTeammates.push(_teamAIPool.get(aiPositions[j].x, aiPositions[j].y, aiPositions[j].z))
      }
    }
    const repulsion = getRepulsionOffset(aiPositions[i] || homePos, repulsionTeammates)

    const poss = possessor
    const hasBall = poss !== null &&
      ((team === 'home' && poss.type === 'home-ai' && poss.index === i) ||
       (team === 'away' && poss.type === 'away-ai' && poss.index === i))

    if (hasBall) {
      const curr = aiPositions[i] || homePos
      const dribbleZ = team === 'home'
        ? Math.max(curr.z - 10, -fieldHalfLength + 5)
        : Math.min(curr.z + 10, fieldHalfLength - 5)
      target = { x: curr.x * 0.8, y: 0, z: dribbleZ }
      speedMul = 1.0
    }

    const isPassReceiver = passTarget?.team === team && passTarget.index === i && !hasPossession
    if (isPassReceiver) {
      target = ballPos
      speedMul = 1.5
    }

    const finalTarget = {
      x: target.x + repulsion.x,
      y: 0,
      z: target.z + repulsion.z,
    }

    const curr = aiPositions[i] || homePos
    const dx = finalTarget.x - curr.x
    const dz = finalTarget.z - curr.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    const speed = aiSpeed * speedMul
    const step = speed * delta

    let aiMoving = false
    let updatedFacing: number | undefined

    if (dist > 0.5) {
      const nx = curr.x + (dx / dist) * Math.min(step, dist)
      const nz = curr.z + (dz / dist) * Math.min(step, dist)
      aiPositions[i] = { x: nx, y: 0, z: nz }
      const newAngle = Math.atan2(-dx, -dz)
      aiFacings[i] = newAngle
      aiMoving = true
      if (hasBall) {
        updatedFacing = Math.atan2(-(dx / dist), -(dz / dist))
      }
    }

    const animState: AnimationState = hasBall
      ? 'run'
      : aiMoving
        ? (decision.action === 'sprint' ? 'run' : decision.action === 'run' ? 'run' : 'idle')
        : 'idle'

    const aiP = aiPositions[i]
    results.push({
      position: [aiP.x, 0, aiP.z],
      rotation: aiFacings[i],
      animation: animState,
      facingAngle: updatedFacing,
    })
  }

  return results
}

// ─── Ball Velocity ──────────────────────────────────────────────

/**
 * Update ball velocity tracking from frame-to-frame position delta.
 */
export function updateBallVelocity(
  ballPos: Vec3,
  prevBallPos: Vec3,
  delta: number,
): Vec3 {
  if (delta <= 0) return { x: 0, y: 0, z: 0 }
  return {
    x: (ballPos.x - prevBallPos.x) / delta,
    y: 0,
    z: (ballPos.z - prevBallPos.z) / delta,
  }
}

// ─── Near-Miss Detection ────────────────────────────────────────

/**
 * Detect if the ball nearly went into a goal (close to goal line, outside goal width).
 * Returns true if a near-miss is detected.
 *
 * @param ballX - ball X position
 * @param ballZ - ball Z position
 * @param hasPossession - whether someone currently has the ball
 * @param lastShotTime - when the last shot was taken (ms)
 * @param now - current time (ms)
 * @param fieldHalfLength - half field length
 * @param goalWidth - goal width
 */
export function detectNearMiss(
  ballX: number,
  ballZ: number,
  hasPossession: boolean,
  lastShotTime: number,
  now: number,
  fieldHalfLength: number,
  goalWidth: number,
): boolean {
  if (hasPossession) return false
  if (now - lastShotTime >= 2000) return false
  if (lastShotTime === 0) return false

  const absZ = Math.abs(ballZ)
  const absX = Math.abs(ballX)
  return absZ > fieldHalfLength - 1 && absX > goalWidth / 2
}

// ─── Possession Owner Resolution ────────────────────────────────

/**
 * Resolve the possessor into a PossessionTeam + index for the AI decision engine.
 */
export function resolvePossessionTeam(
  possessor: { type: PossessorType; index: number } | null,
): { team: PossessionTeam; index: number } {
  if (!possessor) return { team: null, index: -1 }

  switch (possessor.type) {
    case 'player': return { team: 'player', index: 0 }
    case 'player-2': return { team: 'player-2', index: 0 }
    case 'home-ai': return { team: 'home', index: possessor.index }
    case 'away-ai': return { team: 'away', index: possessor.index }
    default: return { team: null, index: -1 }
  }
}
