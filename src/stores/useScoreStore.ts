import { create } from 'zustand'
import type { Scene, GameResult, Difficulty } from '@/types'

const MAX_HISTORY = 500

interface ScoreState {
  currentScore: number
  currentStreak: number
  highScores: Record<string, number>
  history: GameResult[]
  addScore: (points: number) => void
  incrementStreak: () => void
  resetStreak: () => void
  resetCurrentScore: () => void
  saveResult: (game: Scene, score: number, stars: number, difficulty?: Difficulty) => void
  getHighScore: (game: string) => number
  getBestStars: (game: string) => number
  getGamesPlayed: (game: string) => number
  getAverageScore: (game: string) => number
}

export const useScoreStore = create<ScoreState>()((set, get) => ({
  currentScore: 0,
  currentStreak: 0,
  highScores: {},
  history: [],

  addScore: (points) =>
    set((s) => ({ currentScore: s.currentScore + points })),

  incrementStreak: () =>
    set((s) => ({ currentStreak: s.currentStreak + 1 })),

  resetStreak: () => set({ currentStreak: 0 }),

  resetCurrentScore: () => set({ currentScore: 0, currentStreak: 0 }),

  saveResult: (game, score, stars, difficulty) => {
    set((s) => {
      const key = game
      const prevHigh = s.highScores[key] ?? 0
      const isLowerBetter = game === 'minigolf'
      const newHigh = prevHigh === 0
        ? score
        : isLowerBetter
          ? Math.min(prevHigh, score)
          : Math.max(prevHigh, score)
      return {
        highScores: {
          ...s.highScores,
          [key]: newHigh,
        },
        history: [...s.history, { game, score, stars, date: Date.now(), difficulty }].slice(-MAX_HISTORY),
      }
    })
  },

  getHighScore: (game) => get().highScores[game] ?? 0,

  getBestStars: (game) => {
    const results = get().history.filter((r) => r.game === game)
    return results.length ? Math.max(...results.map((r) => r.stars)) : 0
  },

  getGamesPlayed: (game) => get().history.filter((r) => r.game === game).length,

  getAverageScore: (game) => {
    const results = get().history.filter((r) => r.game === game)
    if (results.length === 0) return 0
    return Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
  },
}))
