import { create } from 'zustand'
import { BOWLING_CONFIG } from './config'

type BowlingPhase = 'positioning' | 'charging' | 'spinning' | 'rolling' | 'scoring' | 'frameover' | 'done'

interface BowlingState {
  phase: BowlingPhase
  currentFrame: number
  effectiveTotalFrames: number
  ballsThisFrame: number
  frameScores: number[]
  frameBalls: number[][]
  pinsKnocked: boolean[]
  totalPinsThisFrame: number
  bowlerX: number
  power: number
  spinAngle: number
  isStrike: boolean
  isSpare: boolean
  hasExtraBall: boolean

  setBowlerX: (x: number) => void
  startCharging: () => void
  setPower: (p: number) => void
  startSpinning: () => void
  setSpinAngle: (a: number) => void
  release: () => { power: number; spin: number; bowlerX: number }
  setPinsKnocked: (knocked: boolean[]) => void
  endBall: () => void
  nextFrame: () => void
  grantExtraBall: () => void
  resetGame: (totalFrames?: number) => void
  getScorecard: () => (number | null)[]
}

export const useBowling = create<BowlingState>((set, get) => ({
  phase: 'positioning',
  currentFrame: 1,
  effectiveTotalFrames: BOWLING_CONFIG.totalFrames,
  ballsThisFrame: 0,
  frameScores: [],
  frameBalls: [],
  pinsKnocked: Array(10).fill(false),
  totalPinsThisFrame: 0,
  bowlerX: 0,
  power: 0,
  spinAngle: 0,
  isStrike: false,
  isSpare: false,
  hasExtraBall: false,

  setBowlerX: (x) => set({ bowlerX: x }),

  startCharging: () => set({ phase: 'charging', power: 0 }),

  setPower: (p) => set({ power: p }),

  startSpinning: () => set({ phase: 'spinning', spinAngle: 0 }),

  setSpinAngle: (a) => set({ spinAngle: a }),

  release: () => {
    const { power, spinAngle, bowlerX } = get()
    set({ phase: 'rolling', ballsThisFrame: get().ballsThisFrame + 1 })
    return { power, spin: spinAngle, bowlerX }
  },

  setPinsKnocked: (knocked) => {
    const count = knocked.filter(Boolean).length
    set({ pinsKnocked: knocked, totalPinsThisFrame: count })
  },

  endBall: () => {
    const { pinsKnocked, ballsThisFrame, hasExtraBall, frameBalls, currentFrame, effectiveTotalFrames } = get()
    const knockedCount = pinsKnocked.filter(Boolean).length
    const isFinalFrame = currentFrame === effectiveTotalFrames

    // ── 10th (final) frame special rules ──
    // Strike or spare in final frame grants bonus balls (up to 3 total)
    if (isFinalFrame) {
      if (ballsThisFrame === 1 && knockedCount === 10) {
        // Final frame strike — get 2 more balls, reset pins
        set((s) => ({
          phase: 'positioning',
          isStrike: true,
          isSpare: false,
          pinsKnocked: Array(10).fill(false),
          totalPinsThisFrame: 0,
          frameBalls: [...s.frameBalls, [10]],
        }))
        return
      }
      if (ballsThisFrame === 2 && knockedCount === 10) {
        // Final frame spare on ball 2 — get 1 more ball, reset pins
        const ball1 = frameBalls[frameBalls.length - 1]?.[0] ?? 0
        set((s) => ({
          phase: 'positioning',
          isSpare: true,
          isStrike: false,
          pinsKnocked: Array(10).fill(false),
          totalPinsThisFrame: 0,
          frameBalls: [...s.frameBalls.slice(0, -1), [ball1, 10 - ball1]],
        }))
        return
      }
      if (ballsThisFrame === 2 && frameBalls[frameBalls.length - 1]?.[0] === 10) {
        // Ball 2 after a final-frame strike — check if another strike
        if (knockedCount === 10) {
          // Double strike — get 1 more ball, reset pins
          set((s) => ({
            phase: 'positioning',
            isStrike: true,
            pinsKnocked: Array(10).fill(false),
            totalPinsThisFrame: 0,
            frameBalls: [...s.frameBalls, [10]],
          }))
          return
        }
        // Not a strike — record and get bonus ball
        set((s) => ({
          phase: 'positioning',
          frameBalls: [...s.frameBalls, [knockedCount]],
        }))
        return
      }
      if (ballsThisFrame >= 3 || (ballsThisFrame >= 2 && !get().isStrike && !get().isSpare)) {
        // Final frame complete — record and end
        const lastFrame = frameBalls[frameBalls.length - 1] ?? []
        const totalKnocked = knockedCount
        if (lastFrame.length < 2) {
          const ball1 = lastFrame[0] ?? 0
          set((s) => ({
            phase: 'frameover',
            frameScores: [...s.frameScores, totalKnocked * BOWLING_CONFIG.pinPoint],
            frameBalls: [...s.frameBalls.slice(0, -1), [ball1, knockedCount - ball1]],
          }))
        } else {
          set((s) => ({
            phase: 'frameover',
            frameScores: [...s.frameScores, totalKnocked * BOWLING_CONFIG.pinPoint],
            frameBalls: [...s.frameBalls, [knockedCount - (lastFrame.reduce((a: number, b: number) => a + b, 0))]],
          }))
        }
        return
      }
    }

    // ── Standard frames 1-9 ──
    if (knockedCount === 10 && ballsThisFrame === 1) {
      // Strike!
      const score = BOWLING_CONFIG.strikePoints
      set((s) => ({
        phase: 'frameover',
        isStrike: true,
        isSpare: false,
        frameScores: [...s.frameScores, score],
        frameBalls: [...s.frameBalls, [10]],
      }))
    } else if (knockedCount === 10 && ballsThisFrame === 2) {
      // Spare
      const score = BOWLING_CONFIG.sparePoints
      const ball1 = frameBalls[frameBalls.length - 1]?.[0] ?? 0
      const ball2 = 10 - ball1
      set((s) => ({
        phase: 'frameover',
        isStrike: false,
        isSpare: true,
        frameScores: [...s.frameScores, score],
        frameBalls: [
          ...s.frameBalls.slice(0, -1),
          [ball1, ball2],
        ],
      }))
    } else if (ballsThisFrame >= 2 && hasExtraBall) {
      // Extra ball powerup: get one more try
      set({ phase: 'positioning', hasExtraBall: false })
    } else if (ballsThisFrame >= 2) {
      // Open frame
      const score = knockedCount * BOWLING_CONFIG.pinPoint
      const ball1 = frameBalls[frameBalls.length - 1]?.[0] ?? 0
      const ball2 = knockedCount - ball1
      set((s) => ({
        phase: 'frameover',
        isStrike: false,
        isSpare: false,
        frameScores: [...s.frameScores, score],
        frameBalls: [
          ...s.frameBalls.slice(0, -1),
          [ball1, ball2],
        ],
      }))
    } else {
      // First ball, not a strike - record ball 1 pins
      set((s) => ({
        phase: 'positioning',
        frameBalls: [...s.frameBalls, [knockedCount]],
      }))
    }
  },

  grantExtraBall: () => set({ hasExtraBall: true }),

  nextFrame: () => {
    const { currentFrame, effectiveTotalFrames } = get()
    if (currentFrame >= effectiveTotalFrames) {
      set({ phase: 'done' })
    } else {
      set({
        currentFrame: currentFrame + 1,
        phase: 'positioning',
        ballsThisFrame: 0,
        pinsKnocked: Array(10).fill(false),
        totalPinsThisFrame: 0,
        bowlerX: 0,
        power: 0,
        spinAngle: 0,
        isStrike: false,
        isSpare: false,
        hasExtraBall: false,
      })
    }
  },

  resetGame: (totalFrames?: number) => set({
    phase: 'positioning',
    currentFrame: 1,
    effectiveTotalFrames: totalFrames ?? BOWLING_CONFIG.totalFrames,
    ballsThisFrame: 0,
    frameScores: [],
    frameBalls: [],
    pinsKnocked: Array(10).fill(false),
    totalPinsThisFrame: 0,
    bowlerX: 0,
    power: 0,
    spinAngle: 0,
    isStrike: false,
    isSpare: false,
    hasExtraBall: false,
  }),

  /**
   * Simplified bowling scorecard — does not implement 10th-frame bonus ball rules.
   * Standard bowling allows up to 3 balls on the final frame for strikes/spares,
   * but this game uses a simplified model appropriate for the educational context.
   * If strict 10-frame scoring is needed in future, add bonus ball tracking to BowlingState.
   */
  getScorecard: () => {
    const { frameBalls } = get()
    const scores: (number | null)[] = []
    let runningTotal = 0

    for (let i = 0; i < frameBalls.length; i++) {
      const frame = frameBalls[i]
      const ball1 = frame[0] ?? 0
      const ball2 = frame[1] ?? 0

      if (ball1 === 10) {
        // Strike: need next 2 balls
        const next1 = frameBalls[i + 1]?.[0]
        const next2 = frameBalls[i + 1]?.[0] === 10
          ? frameBalls[i + 2]?.[0]
          : frameBalls[i + 1]?.[1]
        if (next1 !== undefined && next2 !== undefined) {
          runningTotal += 10 + next1 + next2
          scores.push(runningTotal)
        } else {
          scores.push(null) // Can't calculate yet
        }
      } else if (ball1 + ball2 === 10) {
        // Spare: need next 1 ball
        const next1 = frameBalls[i + 1]?.[0]
        if (next1 !== undefined) {
          runningTotal += 10 + next1
          scores.push(runningTotal)
        } else {
          scores.push(null)
        }
      } else {
        runningTotal += ball1 + ball2
        scores.push(runningTotal)
      }
    }
    return scores
  },
}))
