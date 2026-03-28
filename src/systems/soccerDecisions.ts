/**
 * Soccer AI Decision Engine
 *
 * Ported from Gnarly Nutmeg's battle-tested AI system.
 * Pure functions — no classes, no state, no SDK dependencies.
 * Each function takes game context and returns a target position.
 *
 * Replaces the broken getTargetPosition() which blended home + ball
 * positions and froze all players when the ball wasn't moving.
 */

import {
  type SoccerAIRole,
  type Vec3,
  ROLE_DEFINITIONS,
  getRoleHomePosition,
  getGoalkeeperTarget,
} from './soccerAI'
import { clamp, lerp } from '@/utils/math'

// ─── Types ──────────────────────────────────────────────────────

export type PossessionTeam = 'home' | 'away' | 'player' | 'player-2' | null

export interface MatchContext {
  ballPos: Vec3
  ballVelocity: Vec3
  possession: PossessionTeam
  possessorIndex: number
  myPos: Vec3
  myRole: SoccerAIRole
  myIndex: number
  myTeam: 'home' | 'away'
  teammatePositions: Vec3[]
  opponentPositions: Vec3[]
  playerPos: Vec3
  attackingPositiveZ: boolean
  fieldHalfWidth: number
  fieldHalfLength: number
  goalWidth: number
  /** Which team the human player is on — used to correctly attribute 'player' possession */
  playerTeam?: 'home' | 'away'
  /** Which team player 2 is on (2P mode) */
  player2Team?: 'home' | 'away'
}

export interface AIDecision {
  target: Vec3
  speed: number       // Multiplier: 0 = idle, 1 = normal, 1.5 = sprint
  action: 'idle' | 'run' | 'sprint'
}

// ─── Helpers ────────────────────────────────────────────────────

function dist2D(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dz * dz)
}

/** Our goal line Z (the goal we defend) */
function ownGoalZ(attackingPositiveZ: boolean, fieldHalfLength: number): number {
  return attackingPositiveZ ? -fieldHalfLength : fieldHalfLength
}

/** Opponent's goal line Z (the goal we attack) */
function opponentGoalZ(attackingPositiveZ: boolean, fieldHalfLength: number): number {
  return attackingPositiveZ ? fieldHalfLength : -fieldHalfLength
}

/** Direction sign: +1 if attacking +Z, -1 if attacking -Z */
function attackDir(attackingPositiveZ: boolean): number {
  return attackingPositiveZ ? 1 : -1
}

/** Is the ball in our defensive third (within 15 units of our goal)? */
function ballInDefensiveThird(ctx: MatchContext): boolean {
  const goalZ = ownGoalZ(ctx.attackingPositiveZ, ctx.fieldHalfLength)
  return Math.abs(ctx.ballPos.z - goalZ) < ctx.fieldHalfLength * 0.33
}

/** Is the ball in our half? */
function ballInOurHalf(ctx: MatchContext): boolean {
  const dir = attackDir(ctx.attackingPositiveZ)
  // Ball is in our half if it's behind center relative to our attack direction
  return ctx.ballPos.z * dir < 0
}

/** Is the ball on the left flank (negative X)? */
function ballOnLeftFlank(ctx: MatchContext): boolean {
  return ctx.ballPos.x < 0
}

/** Is the ball on the right flank (positive X)? */
function ballOnRightFlank(ctx: MatchContext): boolean {
  return ctx.ballPos.x > 0
}

/** Is this AI the closest teammate to the ball? */
function isClosestToBall(ctx: MatchContext): boolean {
  const myDist = dist2D(ctx.myPos, ctx.ballPos)
  for (const mate of ctx.teammatePositions) {
    if (dist2D(mate, ctx.ballPos) < myDist) return false
  }
  return true
}

/** Does my team have possession? */
function myTeamHasBall(ctx: MatchContext): boolean {
  if (ctx.possession === 'player') {
    const pTeam = ctx.playerTeam ?? 'home'
    return ctx.myTeam === pTeam
  }
  if (ctx.possession === 'player-2') {
    const p2Team = ctx.player2Team ?? 'away'
    return ctx.myTeam === p2Team
  }
  return ctx.possession === ctx.myTeam
}

/** Does the opponent have the ball? */
function opponentHasBall(ctx: MatchContext): boolean {
  if (ctx.possession === null) return false
  return !myTeamHasBall(ctx)
}

// ─── Main Decision Router ───────────────────────────────────────

/**
 * Central AI decision function — replaces getTargetPosition().
 *
 * Routes to context-aware, role-specific positioning based on:
 * 1. Goalkeeper → goalkeeper-specific logic
 * 2. My team has ball → offensive support runs
 * 3. Opponent has ball → defensive positioning
 * 4. Ball is loose → coordinated pursuit
 */
export function getAIDecision(ctx: MatchContext): AIDecision {
  if (ctx.myRole === 'goalkeeper') {
    return getGoalkeeperDecision(ctx)
  }

  if (myTeamHasBall(ctx)) {
    return getOffensivePosition(ctx)
  }

  if (opponentHasBall(ctx)) {
    return getDefensivePosition(ctx)
  }

  // Ball is loose (no possession)
  return getLooseBallPosition(ctx)
}

// ─── Defensive Behavior ─────────────────────────────────────────

/**
 * When opponent has the ball, fall back and mark.
 *
 * Ported from AIDefensiveBehavior.ts:
 * - Defenders close down threats on their flank
 * - Midfielders hold shape and cut passing lanes
 * - Striker presses but doesn't track back past midfield
 */
export function getDefensivePosition(ctx: MatchContext): AIDecision {
  const role = ctx.myRole
  const goalZ = ownGoalZ(ctx.attackingPositiveZ, ctx.fieldHalfLength)
  const dir = attackDir(ctx.attackingPositiveZ)
  const inDefThird = ballInDefensiveThird(ctx)
  const inOurHalf = ballInOurHalf(ctx)

  if (role === 'left-back' || role === 'right-back') {
    return getDefenderDefensivePos(ctx, role, goalZ, dir, inDefThird, inOurHalf)
  }

  if (role === 'center-mid-1' || role === 'center-mid-2') {
    return getMidfielderDefensivePos(ctx, role, goalZ, dir, inDefThird, inOurHalf)
  }

  // Striker
  return getStrikerDefensivePos(ctx, dir)
}

function getDefenderDefensivePos(
  ctx: MatchContext,
  role: SoccerAIRole,
  goalZ: number,
  _dir: number,
  inDefThird: boolean,
  inOurHalf: boolean,
): AIDecision {
  const isLeft = role === 'left-back'
  const onMyFlank = isLeft ? ballOnLeftFlank(ctx) : ballOnRightFlank(ctx)

  // URGENT: Ball in defensive third on my flank → close down
  if (inDefThird && onMyFlank) {
    // Position goal-side of the ball: 30% toward own goal, 70% toward ball
    const targetZ = lerp(ctx.ballPos.z, goalZ, 0.3)
    const targetX = lerp(ctx.ballPos.x, ctx.myPos.x, 0.3)
    return {
      target: { x: clamp(targetX, -ctx.fieldHalfWidth, ctx.fieldHalfWidth), y: 0, z: targetZ },
      speed: 1.3,
      action: 'sprint',
    }
  }

  // Ball in our half → maintain defensive shape, track ball laterally
  if (inOurHalf) {
    const homePos = getRoleHomePosition(role, ctx.fieldHalfWidth, ctx.fieldHalfLength, ctx.attackingPositiveZ)
    const defensiveZ = lerp(homePos.z, goalZ, 0.2) // Deeper than home
    const lateralTrack = lerp(homePos.x, ctx.ballPos.x, 0.2) // Slight ball tracking
    return {
      target: { x: clamp(lateralTrack, -ctx.fieldHalfWidth, ctx.fieldHalfWidth), y: 0, z: defensiveZ },
      speed: 1.0,
      action: 'run',
    }
  }

  // Ball in opponent half → cautious support, stay back
  const homePos = getRoleHomePosition(role, ctx.fieldHalfWidth, ctx.fieldHalfLength, ctx.attackingPositiveZ)
  // Push up slightly behind ball but not past midfield
  const supportZ = lerp(homePos.z, 0, 0.3) // Move toward center but stay in own half
  return {
    target: { x: homePos.x, y: 0, z: supportZ },
    speed: 0.8,
    action: 'run',
  }
}

function getMidfielderDefensivePos(
  ctx: MatchContext,
  role: SoccerAIRole,
  goalZ: number,
  _dir: number,
  inDefThird: boolean,
  inOurHalf: boolean,
): AIDecision {
  const homePos = getRoleHomePosition(role, ctx.fieldHalfWidth, ctx.fieldHalfLength, ctx.attackingPositiveZ)

  // Ball in defensive third → help defense (position between ball and goal)
  if (inDefThird) {
    const betweenZ = lerp(ctx.ballPos.z, goalZ, 0.4)
    const lateralTrack = lerp(homePos.x, ctx.ballPos.x, 0.3)
    return {
      target: { x: clamp(lateralTrack, -ctx.fieldHalfWidth, ctx.fieldHalfWidth), y: 0, z: betweenZ },
      speed: 1.2,
      action: 'sprint',
    }
  }

  // Ball in our half → hold midfield shape, cut passing lanes
  if (inOurHalf) {
    // Position between ball and goal but stay in midfield zone
    const midZ = lerp(homePos.z, ctx.ballPos.z, 0.25)
    const lateralTrack = lerp(homePos.x, ctx.ballPos.x, 0.2)
    return {
      target: { x: clamp(lateralTrack, -ctx.fieldHalfWidth, ctx.fieldHalfWidth), y: 0, z: midZ },
      speed: 1.0,
      action: 'run',
    }
  }

  // Ball in opponent half → hold formation
  return {
    target: homePos,
    speed: 0.8,
    action: 'run',
  }
}

function getStrikerDefensivePos(
  ctx: MatchContext,
  _dir: number,
): AIDecision {
  // Press opponent defenders — move toward ball carrier but don't track back past midfield
  const pressZ = clamp(ctx.ballPos.z, -ctx.fieldHalfLength * 0.3, ctx.fieldHalfLength * 0.3)
  const pressX = lerp(0, ctx.ballPos.x, 0.5) // Drift toward ball's lateral position

  return {
    target: { x: clamp(pressX, -ctx.fieldHalfWidth * 0.6, ctx.fieldHalfWidth * 0.6), y: 0, z: pressZ },
    speed: 1.0,
    action: 'run',
  }
}

// ─── Offensive Behavior ─────────────────────────────────────────

/**
 * When our team has the ball, make support runs.
 *
 * Ported from AIOffensiveBehavior.ts:
 * - Striker runs ahead of ball toward opponent goal
 * - Midfielders spread wide for passing options
 * - Defenders push up cautiously as back-pass option
 *
 * Key: Positions are RELATIVE TO BALL, not home position.
 * This is why players will move even when ball is stationary.
 */
export function getOffensivePosition(ctx: MatchContext): AIDecision {
  const role = ctx.myRole
  const dir = attackDir(ctx.attackingPositiveZ)
  const oppGoal = opponentGoalZ(ctx.attackingPositiveZ, ctx.fieldHalfLength)

  if (role === 'striker') {
    return getStrikerOffensivePos(ctx, dir, oppGoal)
  }

  if (role === 'center-mid-1' || role === 'center-mid-2') {
    return getMidfielderOffensivePos(ctx, role, dir, oppGoal)
  }

  // Defenders
  return getDefenderOffensivePos(ctx, role, dir)
}

function getStrikerOffensivePos(
  ctx: MatchContext,
  dir: number,
  oppGoal: number,
): AIDecision {
  // Run ahead of ball toward opponent goal (8-10 units forward)
  const forwardRun = ctx.ballPos.z + dir * 10
  // Don't overshoot past the goal
  const targetZ = dir > 0
    ? Math.min(forwardRun, oppGoal - 5)
    : Math.max(forwardRun, oppGoal + 5)

  // Lateral variation for width (based on role's preferred side)
  const lateralOffset = (Math.sin(ctx.myIndex * 2.7) * 6) // Deterministic spread
  const targetX = clamp(ctx.ballPos.x + lateralOffset, -ctx.fieldHalfWidth * 0.7, ctx.fieldHalfWidth * 0.7)

  return {
    target: { x: targetX, y: 0, z: targetZ },
    speed: 1.3,
    action: 'sprint',
  }
}

function getMidfielderOffensivePos(
  ctx: MatchContext,
  role: SoccerAIRole,
  dir: number,
  oppGoal: number,
): AIDecision {
  // Support behind striker (5-6 units ahead of ball)
  const forwardSupport = ctx.ballPos.z + dir * 6
  const targetZ = dir > 0
    ? Math.min(forwardSupport, oppGoal - 10)
    : Math.max(forwardSupport, oppGoal + 10)

  // Spread wide for passing options (±8 units lateral from ball)
  const side = role === 'center-mid-1' ? -1 : 1
  const lateralSpread = ctx.ballPos.x + side * 8
  const targetX = clamp(lateralSpread, -ctx.fieldHalfWidth * 0.8, ctx.fieldHalfWidth * 0.8)

  return {
    target: { x: targetX, y: 0, z: targetZ },
    speed: 1.1,
    action: 'run',
  }
}

function getDefenderOffensivePos(
  ctx: MatchContext,
  role: SoccerAIRole,
  dir: number,
): AIDecision {
  // Push up cautiously — stay 5 units behind ball
  const behindBall = ctx.ballPos.z - dir * 5
  const homePos = getRoleHomePosition(role, ctx.fieldHalfWidth, ctx.fieldHalfLength, ctx.attackingPositiveZ)
  // Don't push past midfield
  const targetZ = dir > 0
    ? Math.max(behindBall, homePos.z)
    : Math.min(behindBall, homePos.z)

  // Maintain defensive width
  const targetX = homePos.x

  return {
    target: { x: targetX, y: 0, z: targetZ },
    speed: 0.8,
    action: 'run',
  }
}

// ─── Loose Ball Behavior ────────────────────────────────────────

/**
 * When no one has the ball, coordinate pursuit.
 *
 * Ported from AIDecisionMaker.shouldPursueBasedOnTeamCoordination:
 * - Only the closest teammate chases (prevents clumping)
 * - Non-closest move to support positions
 * - Too far away → return to formation home
 */
export function getLooseBallPosition(ctx: MatchContext): AIDecision {
  const def = ROLE_DEFINITIONS[ctx.myRole]
  const distToBall = dist2D(ctx.myPos, ctx.ballPos)
  const maxPursuit = def.pursuitDistance * 1.5

  // If ball is too far, return to home position
  if (distToBall > maxPursuit) {
    const homePos = getRoleHomePosition(ctx.myRole, ctx.fieldHalfWidth, ctx.fieldHalfLength, ctx.attackingPositiveZ)
    return {
      target: homePos,
      speed: 0.8,
      action: 'run',
    }
  }

  // Am I the closest teammate to the ball?
  if (isClosestToBall(ctx)) {
    // Sprint to ball!
    return {
      target: ctx.ballPos,
      speed: 1.5,
      action: 'sprint',
    }
  }

  // Not closest — move to support position near ball
  // Position roughly between ball and own goal, offset laterally
  const goalZ = ownGoalZ(ctx.attackingPositiveZ, ctx.fieldHalfLength)
  const supportZ = lerp(ctx.ballPos.z, goalZ, 0.25)
  // Offset laterally based on role to avoid clumping
  const homePos = getRoleHomePosition(ctx.myRole, ctx.fieldHalfWidth, ctx.fieldHalfLength, ctx.attackingPositiveZ)
  const lateralOffset = lerp(ctx.ballPos.x, homePos.x, 0.6)

  return {
    target: { x: lateralOffset, y: 0, z: supportZ },
    speed: 1.0,
    action: 'run',
  }
}

// ─── Goalkeeper Decision ────────────────────────────────────────

/**
 * Enhanced goalkeeper positioning with shot prediction.
 *
 * Ported from AIGoalkeeperBehavior.ts:
 * - Predicts interception when ball velocity heading toward goal
 * - Comes off line more aggressively when ball is in penalty area
 * - Falls back to existing lateral tracking from soccerAI.ts
 */
export function getGoalkeeperDecision(ctx: MatchContext): AIDecision {
  const goalZ = ownGoalZ(ctx.attackingPositiveZ, ctx.fieldHalfLength)
  const dir = attackDir(ctx.attackingPositiveZ)

  // Check if ball is heading toward our goal at speed
  const ballSpeed = Math.sqrt(
    ctx.ballVelocity.x * ctx.ballVelocity.x + ctx.ballVelocity.z * ctx.ballVelocity.z,
  )
  const ballMovingTowardGoal = (dir > 0)
    ? ctx.ballVelocity.z < -2.0  // Attacking +Z, so shots come from +Z toward -Z
    : ctx.ballVelocity.z > 2.0   // Attacking -Z, so shots come from -Z toward +Z

  // SHOT PREDICTION: If ball is moving fast toward our goal, predict intercept
  if (ballSpeed > 2.0 && ballMovingTowardGoal) {
    // Predict where ball will be in 0.3-0.5 seconds
    const predTime = clamp(0.5 - ballSpeed * 0.02, 0.3, 0.5)
    const predictedX = ctx.ballPos.x + ctx.ballVelocity.x * predTime

    // Only react if predicted position is within goal area
    const halfGoal = ctx.goalWidth / 2
    if (Math.abs(predictedX) < halfGoal + 2) {
      const interceptX = clamp(predictedX, -halfGoal, halfGoal)
      const interceptZ = goalZ + (dir > 0 ? 2 : -2) // Stand in front of goal

      return {
        target: { x: interceptX, y: 0, z: interceptZ },
        speed: 1.5,
        action: 'sprint',
      }
    }
  }

  // COME OFF LINE: When ball is close (penalty area), be more aggressive
  const distToBall = Math.abs(ctx.ballPos.z - goalZ)
  if (distToBall < 18 && !myTeamHasBall(ctx)) {
    // Come off line to narrow the angle
    const comeOutDist = ((18 - distToBall) / 18) * 5
    const comeOutZ = dir > 0
      ? goalZ + comeOutDist + 2
      : goalZ - comeOutDist - 2

    const trackX = clamp(ctx.ballPos.x, -ctx.goalWidth / 2, ctx.goalWidth / 2)
    return {
      target: { x: trackX, y: 0, z: comeOutZ },
      speed: 1.2,
      action: 'run',
    }
  }

  // STANDARD: Use existing goalkeeper tracking from soccerAI.ts
  const baseTarget = getGoalkeeperTarget(goalZ, ctx.ballPos, ctx.goalWidth)
  return {
    target: baseTarget,
    speed: 1.0,
    action: 'run',
  }
}

// ─── Role-Aware Shoot/Pass Probabilities ────────────────────────

/**
 * Get shoot probability based on role and distance to goal.
 * Ported from AIOffensiveBehavior.evaluateShootingOpportunity.
 */
export function getShootProbability(role: SoccerAIRole, distToGoal: number): number {
  if (role === 'striker') {
    if (distToGoal < 12) return 0.85
    if (distToGoal < 20) return 0.60
    return 0.0
  }
  if (role === 'center-mid-1' || role === 'center-mid-2') {
    if (distToGoal < 12) return 0.70
    if (distToGoal < 18) return 0.40
    return 0.0
  }
  // Defenders
  if (distToGoal < 12) return 0.50
  if (distToGoal < 15) return 0.20
  return 0.0
}

/**
 * Get per-frame pass probability based on role.
 * Higher values = AI passes sooner after picking up the ball.
 * Midfielders and defenders pass more; strikers hold and shoot.
 */
export function getPassProbability(role: SoccerAIRole): number {
  if (role === 'striker') return 0.03
  if (role === 'center-mid-1' || role === 'center-mid-2') return 0.05
  // Defenders pass the most (safety-first, get rid of it quickly)
  return 0.06
}
