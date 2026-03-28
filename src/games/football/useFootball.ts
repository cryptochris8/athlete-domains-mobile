import { create } from 'zustand'
import { FOOTBALL_CONFIG } from './config'

type ShotResult = 'hit' | 'miss' | 'interception' | null

interface FootballState {
  timeRemaining: number
  shotsFired: number
  targetsHit: number
  interceptions: number
  shotResult: ShotResult
  power: number
  isPowerCharging: boolean

  shoot: () => void
  registerHit: (points: number) => void
  registerMiss: () => void
  registerInterception: () => void
  startCharging: () => void
  setPower: (power: number) => void
  releaseShot: () => { power: number }
  decrementTime: () => boolean
  resetGame: (timeSeconds?: number) => void
}

export const useFootball = create<FootballState>((set, get) => ({
  timeRemaining: FOOTBALL_CONFIG.roundTimeSeconds,
  shotsFired: 0,
  targetsHit: 0,
  interceptions: 0,
  shotResult: null,
  power: 0,
  isPowerCharging: false,

  shoot: () => {
    if (get().timeRemaining <= 0) return
    set({
      shotsFired: get().shotsFired + 1,
      shotResult: null,
    })
  },

  registerHit: (_points: number) => {
    set({
      targetsHit: get().targetsHit + 1,
      shotResult: 'hit',
    })
  },

  registerMiss: () => {
    set({ shotResult: 'miss' })
  },

  registerInterception: () => {
    set({
      interceptions: get().interceptions + 1,
      shotResult: 'interception',
    })
  },

  startCharging: () => {
    if (get().timeRemaining <= 0 || get().isPowerCharging) return
    set({ isPowerCharging: true, power: 0 })
  },

  setPower: (power: number) => set({ power }),

  releaseShot: () => {
    const { power } = get()
    set({ isPowerCharging: false })
    return { power }
  },

  decrementTime: () => {
    const t = get().timeRemaining - 1
    set({ timeRemaining: t })
    return t <= 0
  },

  resetGame: (timeSeconds?: number) => set({
    timeRemaining: timeSeconds ?? FOOTBALL_CONFIG.roundTimeSeconds,
    shotsFired: 0,
    targetsHit: 0,
    interceptions: 0,
    shotResult: null,
    power: 0,
    isPowerCharging: false,
  }),
}))
