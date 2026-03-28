/**
 * Soccer Match Rules System
 *
 * Ported from Gnarly Nutmeg's match management.
 * Pure TypeScript — framework-agnostic.
 *
 * Features:
 * - Half-time system (2 halves × 3 min)
 * - Stoppage time (random 1-3 min)
 * - Overtime (5 min sudden death)
 * - Penalty shootout (best of 5 + sudden death)
 * - Momentum tracking (consecutive goal streaks)
 */

// ─── Match Config ────────────────────────────────────────────────
export const MATCH_CONFIG = {
  halfDurationSeconds: 180,       // 3 minutes per half
  halftimeDurationSeconds: 120,   // 2 minutes halftime break
  overtimeDurationSeconds: 300,   // 5 minutes sudden death
  penaltyRounds: 5,               // Standard rounds before sudden death
  penaltyShotTimeSeconds: 15,     // Time limit per penalty shot
  stoppageTimeMinSeconds: 60,     // Minimum stoppage time (1 min)
  stoppageTimeMaxSeconds: 180,    // Maximum stoppage time (3 min)
  momentumThreshold: 3,           // Consecutive goals for momentum bonus
} as const

// ─── Types ───────────────────────────────────────────────────────
export type MatchStatus =
  | 'waiting'
  | 'first-half'
  | 'halftime'
  | 'second-half'
  | 'overtime'
  | 'penalties'
  | 'finished'

export type MatchTeam = 'home' | 'away'

export type MatchEvent =
  | 'ticking'
  | 'halftime'
  | 'overtime-start'
  | 'match-end'
  | 'penalties-start'
  | `stoppage-time:${number}`
  | `goal:${MatchTeam}`
  | `momentum:${MatchTeam}:${number}`
  | `penalty-goal:${MatchTeam}`
  | `penalty-miss:${MatchTeam}`
  | `penalty-winner:${MatchTeam}`

export interface MatchScore {
  home: number
  away: number
}

export interface MomentumState {
  team: MatchTeam | null
  streak: number
}

export interface PenaltyState {
  round: number
  currentShooter: MatchTeam
  results: { home: ('goal' | 'miss')[]; away: ('goal' | 'miss')[] }
}

export interface MatchState {
  status: MatchStatus
  score: MatchScore
  currentHalf: 1 | 2
  halfTimeRemaining: number
  totalTimeElapsed: number
  stoppageTimeAdded: number
  overtimeRemaining: number
  kickoffTeam: MatchTeam
  momentum: MomentumState
  penalties: PenaltyState | null
  lastScorer: MatchTeam | null
}

// ─── Match State Manager ─────────────────────────────────────────
export function createInitialMatchState(): MatchState {
  return {
    status: 'waiting',
    score: { home: 0, away: 0 },
    currentHalf: 1,
    halfTimeRemaining: MATCH_CONFIG.halfDurationSeconds,
    totalTimeElapsed: 0,
    stoppageTimeAdded: 0,
    overtimeRemaining: 0,
    kickoffTeam: 'home',
    momentum: { team: null, streak: 0 },
    penalties: null,
    lastScorer: null,
  }
}

export function startMatch(state: MatchState): MatchState {
  return { ...state, status: 'first-half', kickoffTeam: 'home' }
}

/**
 * Tick the match timer by 1 second. Returns updated state and events.
 */
export function tickMatch(state: MatchState): { state: MatchState; events: MatchEvent[] } {
  const events: MatchEvent[] = []
  const next = { ...state }

  if (next.status === 'first-half' || next.status === 'second-half') {
    next.halfTimeRemaining--
    next.totalTimeElapsed++

    // Stoppage time notification at 60 seconds remaining
    if (next.halfTimeRemaining === 60 && next.stoppageTimeAdded === 0) {
      const minutes = Math.floor(Math.random() * 3) + 1
      next.stoppageTimeAdded = minutes * 60
      events.push(`stoppage-time:${minutes}`)
    }

    // Ticking sound in last 5 seconds
    if (next.halfTimeRemaining === 5) {
      events.push('ticking')
    }

    // Half ends when timer reaches negative equal to stoppage time
    if (next.halfTimeRemaining <= -next.stoppageTimeAdded) {
      if (next.status === 'first-half') {
        next.status = 'halftime'
        next.stoppageTimeAdded = 0
        events.push('halftime')
      } else {
        // End of second half
        if (next.score.home === next.score.away) {
          next.status = 'overtime'
          next.overtimeRemaining = MATCH_CONFIG.overtimeDurationSeconds
          next.halfTimeRemaining = MATCH_CONFIG.overtimeDurationSeconds
          next.stoppageTimeAdded = 0
          events.push('overtime-start')
        } else {
          next.status = 'finished'
          events.push('match-end')
        }
      }
    }
  } else if (next.status === 'overtime') {
    next.overtimeRemaining--
    next.halfTimeRemaining--
    next.totalTimeElapsed++

    if (next.halfTimeRemaining === 5) {
      events.push('ticking')
    }

    if (next.overtimeRemaining <= 0) {
      if (next.score.home === next.score.away) {
        next.status = 'penalties'
        next.penalties = {
          round: 1,
          currentShooter: 'home',
          results: { home: [], away: [] },
        }
        events.push('penalties-start')
      } else {
        next.status = 'finished'
        events.push('match-end')
      }
    }
  }

  return { state: next, events }
}

/**
 * Start the second half after halftime.
 */
export function startSecondHalf(state: MatchState): MatchState {
  return {
    ...state,
    status: 'second-half',
    currentHalf: 2,
    halfTimeRemaining: MATCH_CONFIG.halfDurationSeconds,
    stoppageTimeAdded: 0,
    // Alternate kickoff team
    kickoffTeam: state.kickoffTeam === 'home' ? 'away' : 'home',
  }
}

/**
 * Register a goal scored. Returns updated state and events.
 */
export function scoreGoal(state: MatchState, team: MatchTeam): { state: MatchState; events: MatchEvent[] } {
  const events: MatchEvent[] = []
  const next = { ...state }
  next.score = { ...state.score }
  next.score[team]++
  next.lastScorer = team

  // Kickoff goes to conceding team
  next.kickoffTeam = team === 'home' ? 'away' : 'home'

  // Update momentum
  next.momentum = { ...state.momentum }
  if (state.momentum.team === team) {
    next.momentum.streak++
  } else {
    next.momentum = { team, streak: 1 }
  }

  events.push(`goal:${team}`)

  if (next.momentum.streak >= MATCH_CONFIG.momentumThreshold) {
    events.push(`momentum:${team}:${next.momentum.streak}`)
  }

  // Sudden death in overtime — goal wins immediately
  if (state.status === 'overtime') {
    next.status = 'finished'
    events.push('match-end')
  }

  return { state: next, events }
}

// ─── Penalty Shootout ────────────────────────────────────────────

/**
 * Record a penalty shot result.
 */
export function recordPenaltyShot(
  state: MatchState,
  result: 'goal' | 'miss',
): { state: MatchState; events: MatchEvent[] } {
  if (!state.penalties) return { state, events: [] }

  const events: MatchEvent[] = []
  const next = { ...state }
  const pen = { ...state.penalties, results: { home: [...state.penalties.results.home], away: [...state.penalties.results.away] } }

  pen.results[pen.currentShooter].push(result)
  events.push(`penalty-${result}:${pen.currentShooter}`)

  // Check if we can determine a winner
  const winner = getPenaltyWinner(pen)
  if (winner) {
    next.status = 'finished'
    next.score = { ...state.score }
    // Add penalty goals to final score display
    events.push(`penalty-winner:${winner}`)
    events.push('match-end')
  } else {
    // Advance to next shooter/round
    if (pen.currentShooter === 'home') {
      pen.currentShooter = 'away'
    } else {
      pen.currentShooter = 'home'
      pen.round++
    }
  }

  next.penalties = pen
  return { state: next, events }
}

/**
 * Check if a penalty shootout has a winner.
 */
export function getPenaltyWinner(pen: PenaltyState): MatchTeam | null {
  const homeGoals = pen.results.home.filter((r) => r === 'goal').length
  const awayGoals = pen.results.away.filter((r) => r === 'goal').length
  const homeShots = pen.results.home.length
  const awayShots = pen.results.away.length
  const rounds = MATCH_CONFIG.penaltyRounds

  // Standard rounds (best of 5)
  if (homeShots <= rounds && awayShots <= rounds) {
    const homeRemaining = rounds - homeShots
    const awayRemaining = rounds - awayShots

    // Home can't catch up even if they score all remaining
    if (awayGoals > homeGoals + homeRemaining && awayShots >= homeShots) return 'away'
    // Away can't catch up even if they score all remaining
    if (homeGoals > awayGoals + awayRemaining && homeShots >= awayShots) return 'home'
    // Both finished standard rounds
    if (homeShots >= rounds && awayShots >= rounds) {
      if (homeGoals > awayGoals) return 'home'
      if (awayGoals > homeGoals) return 'away'
      // Tied — sudden death continues (round increments)
    }
    return null
  }

  // Sudden death (both must have same number of shots in each extra round)
  if (homeShots === awayShots && homeShots > rounds) {
    if (homeGoals > awayGoals) return 'home'
    if (awayGoals > homeGoals) return 'away'
  }

  return null
}

// ─── Helpers ─────────────────────────────────────────────────────

export function getWinner(state: MatchState): MatchTeam | null {
  if (state.score.home > state.score.away) return 'home'
  if (state.score.away > state.score.home) return 'away'
  return null
}

export function formatMatchTime(secondsRemaining: number): string {
  const abs = Math.abs(secondsRemaining)
  const mins = Math.floor(abs / 60)
  const secs = abs % 60
  const prefix = secondsRemaining < 0 ? '+' : ''
  return `${prefix}${mins}:${secs.toString().padStart(2, '0')}`
}
