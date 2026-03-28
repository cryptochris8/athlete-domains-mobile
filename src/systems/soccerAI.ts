/**
 * Soccer AI Formation System
 *
 * Ported from Gnarly Nutmeg's battle-tested 6v6 AI system.
 * Pure TypeScript — no SDK dependencies. Works with any 3D framework.
 *
 * Roles: Goalkeeper, Left Back, Right Back, Center Mid x2, Striker
 * Each role has preferred zones, pursuit tendencies, and discipline factors.
 */

// ─── Role Types ──────────────────────────────────────────────────
export type SoccerAIRole =
  | 'goalkeeper'
  | 'left-back'
  | 'right-back'
  | 'center-mid-1'
  | 'center-mid-2'
  | 'striker'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface FieldZone {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface RoleDefinition {
  name: string
  defensiveContribution: number  // 0-10
  offensiveContribution: number  // 0-10
  preferredZone: FieldZone
  pursuitTendency: number       // 0-1 probability of chasing ball
  positionDiscipline: number    // 0-1 how strictly they hold position
  pursuitDistance: number        // max distance they'll chase the ball
  recoverySpeed: number          // 0-2 multiplier for returning to position
  supportDistance: number        // how close to stay to ball carrier
}

// ─── Role Definitions (from Gnarly Nutmeg playtesting) ────────────
// These are normalized to a field from -1 to 1 on both axes.
// Scale them to your actual field dimensions.

export const ROLE_DEFINITIONS: Record<SoccerAIRole, RoleDefinition> = {
  goalkeeper: {
    name: 'Goalkeeper',
    defensiveContribution: 10,
    offensiveContribution: 1,
    preferredZone: { minX: -1.0, maxX: -0.75, minZ: -0.3, maxZ: 0.3 },
    pursuitTendency: 0.12,
    positionDiscipline: 0.95,
    pursuitDistance: 6,
    recoverySpeed: 1.5,
    supportDistance: 12,
  },
  'left-back': {
    name: 'Left Back',
    defensiveContribution: 8,
    offensiveContribution: 5,
    preferredZone: { minX: -0.8, maxX: 0.2, minZ: -0.9, maxZ: -0.1 },
    pursuitTendency: 0.28,
    positionDiscipline: 0.82,
    pursuitDistance: 12,
    recoverySpeed: 1.4,
    supportDistance: 25,
  },
  'right-back': {
    name: 'Right Back',
    defensiveContribution: 8,
    offensiveContribution: 5,
    preferredZone: { minX: -0.8, maxX: 0.2, minZ: 0.1, maxZ: 0.9 },
    pursuitTendency: 0.28,
    positionDiscipline: 0.82,
    pursuitDistance: 12,
    recoverySpeed: 1.4,
    supportDistance: 25,
  },
  'center-mid-1': {
    name: 'Left Center Mid',
    defensiveContribution: 6,
    offensiveContribution: 7,
    preferredZone: { minX: -0.4, maxX: 0.6, minZ: -0.7, maxZ: 0.1 },
    pursuitTendency: 0.38,
    positionDiscipline: 0.72,
    pursuitDistance: 15,
    recoverySpeed: 1.3,
    supportDistance: 30,
  },
  'center-mid-2': {
    name: 'Right Center Mid',
    defensiveContribution: 6,
    offensiveContribution: 7,
    preferredZone: { minX: -0.4, maxX: 0.6, minZ: -0.1, maxZ: 0.7 },
    pursuitTendency: 0.38,
    positionDiscipline: 0.72,
    pursuitDistance: 15,
    recoverySpeed: 1.3,
    supportDistance: 30,
  },
  striker: {
    name: 'Striker',
    defensiveContribution: 3,
    offensiveContribution: 10,
    preferredZone: { minX: 0.0, maxX: 0.95, minZ: -0.6, maxZ: 0.6 },
    pursuitTendency: 0.42,
    positionDiscipline: 0.62,
    pursuitDistance: 18,
    recoverySpeed: 1.2,
    supportDistance: 28,
  },
}

// ─── AI Constants (from Gnarly Nutmeg tuning) ────────────────────
export const AI_CONSTANTS = {
  /** Minimum distance between teammates */
  teamRepulsionDistance: 14.0,
  /** Strength of teammate avoidance */
  teamRepulsionStrength: 1.2,
  /** How much AI anticipates ball trajectory */
  ballAnticipation: 1.0,
  /** Kickoff formation spacing multiplier */
  kickoffSpacing: 2.0,
  /** Formation discipline during restarts */
  restartDiscipline: 0.9,
  /** Radius around center to avoid during kickoff */
  centerAvoidance: 12.0,
  /** Shot trajectory arc factor (low = driven, high = lob) */
  shotArc: 0.08,
  /** Pass trajectory arc factor */
  passArc: 0.03,
  /** Pass force (normalized) */
  passForce: 3.5,
  /** Shot force (normalized) */
  shotForce: 4.0,
} as const

// ─── Formation System ────────────────────────────────────────────
export const DEFAULT_FORMATION: SoccerAIRole[] = [
  'goalkeeper',
  'left-back',
  'right-back',
  'center-mid-1',
  'center-mid-2',
  'striker',
]

/**
 * Get the home position for a role on a real field.
 *
 * Zone definitions use X as the attacking axis and Z as the lateral axis.
 * The actual field has Z as goal-to-goal and X as sideline-to-sideline,
 * so we map zone.X → field.Z (with direction) and zone.Z → field.X.
 *
 * @param role - AI role
 * @param fieldHalfWidth - half the field width (X axis, sideline to sideline)
 * @param fieldHalfLength - half the field length (Z axis, goal to goal)
 * @param attackingPositiveZ - if true, team attacks toward +Z; if false, toward -Z
 */
export function getRoleHomePosition(
  role: SoccerAIRole,
  fieldHalfWidth: number,
  fieldHalfLength: number,
  attackingPositiveZ: boolean,
): Vec3 {
  const def = ROLE_DEFINITIONS[role]
  const zone = def.preferredZone
  // Center of preferred zone
  const nx = (zone.minX + zone.maxX) / 2  // attacking axis
  const nz = (zone.minZ + zone.maxZ) / 2  // lateral axis

  const dirSign = attackingPositiveZ ? 1 : -1
  return {
    x: nz * fieldHalfWidth,              // lateral axis → field X (sideline)
    y: 0,
    z: nx * fieldHalfLength * dirSign,   // attacking axis → field Z (goal-to-goal)
  }
}

/**
 * Decide if an AI player should pursue the ball based on their role.
 * Uses the role's pursuit tendency as a probability threshold.
 * Pass a pre-computed randomValue to avoid per-frame flicker when called every frame.
 */
export function shouldPursueBall(
  role: SoccerAIRole,
  distanceToBall: number,
  randomValue: number = Math.random(),
): boolean {
  const def = ROLE_DEFINITIONS[role]
  if (distanceToBall > def.pursuitDistance) return false
  return randomValue < def.pursuitTendency
}

/**
 * Calculate target position blending home position with ball position.
 * The discipline factor controls how strongly they're pulled toward home.
 */
export function getTargetPosition(
  role: SoccerAIRole,
  homePos: Vec3,
  ballPos: Vec3,
  teamHasBall: boolean,
): Vec3 {
  const def = ROLE_DEFINITIONS[role]
  // When team has ball, push forward; when defending, hold position more
  const offensivePull = teamHasBall ? 0.3 : 0.0
  const discipline = def.positionDiscipline - offensivePull

  return {
    x: homePos.x * discipline + ballPos.x * (1 - discipline),
    y: 0,
    z: homePos.z * discipline + ballPos.z * (1 - discipline),
  }
}

/**
 * Apply teammate repulsion — keep AI players from clumping.
 * Returns an offset vector to add to the target position.
 */
export function getRepulsionOffset(
  myPos: Vec3,
  teammatePositions: Vec3[],
): Vec3 {
  let offsetX = 0
  let offsetZ = 0

  for (const mate of teammatePositions) {
    const dx = myPos.x - mate.x
    const dz = myPos.z - mate.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist < AI_CONSTANTS.teamRepulsionDistance && dist > 0.1) {
      const strength = AI_CONSTANTS.teamRepulsionStrength * (1 - dist / AI_CONSTANTS.teamRepulsionDistance)
      offsetX += (dx / dist) * strength
      offsetZ += (dz / dist) * strength
    }
  }

  return { x: offsetX, y: 0, z: offsetZ }
}

/**
 * Calculate goalkeeper target position — tracks ball laterally along goal line.
 * @param goalZ - Z position of the goal the GK defends
 * @param ballPos - current ball position
 * @param goalWidth - width of the goal (for clamping lateral movement)
 */
export function getGoalkeeperTarget(
  goalZ: number,
  ballPos: Vec3,
  goalWidth: number,
): Vec3 {
  // Stand 2m in front of goal line
  const standoff = goalZ > 0 ? -2 : 2
  const baseZ = goalZ + standoff

  // Track ball's X position, clamped to goal width
  const halfGoal = goalWidth / 2 - 0.3
  const trackX = Math.max(-halfGoal, Math.min(halfGoal, ballPos.x))

  // Come off the line when ball is close (narrow the angle)
  const distZ = Math.abs(ballPos.z - goalZ)
  const comeOut = distZ < 20 ? ((20 - distZ) / 20) * 4 : 0
  const adjustedZ = goalZ > 0 ? baseZ - comeOut : baseZ + comeOut

  return { x: trackX, y: 0, z: adjustedZ }
}
