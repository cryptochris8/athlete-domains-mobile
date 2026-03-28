import { create } from 'zustand'
import { BASKETBALL_CONFIG } from './config'

type ShotResult = 'swish' | 'backboard' | 'rim' | 'miss'

interface BasketballState {
  shotsRemaining: number
  timeRemaining: number
  aimAngle: number
  power: number
  isPowerCharging: boolean
  isBallFlying: boolean
  shotResult: ShotResult | null
  lastShotPoints: number
  hitBackboard: boolean
  hitRim: boolean

  setAimAngle: (angle: number) => void
  startCharging: () => void
  setPower: (power: number) => void
  shoot: () => { power: number; aimAngle: number }
  registerBackboardHit: () => void
  registerRimHit: () => void
  registerScore: () => ShotResult
  registerMiss: () => void
  resetBall: () => void
  decrementTime: () => boolean
  resetGame: (totalShots?: number, timeSeconds?: number) => void
}

export const useBasketball = create<BasketballState>((set, get) => ({
  shotsRemaining: BASKETBALL_CONFIG.totalShots,
  timeRemaining: BASKETBALL_CONFIG.roundTimeSeconds,
  aimAngle: 0,
  power: 0,
  isPowerCharging: false,
  isBallFlying: false,
  shotResult: null,
  lastShotPoints: 0,
  hitBackboard: false,
  hitRim: false,

  setAimAngle: (angle) => set({ aimAngle: angle }),

  startCharging: () => {
    if (get().isBallFlying || get().shotsRemaining <= 0) return
    set({ isPowerCharging: true, power: 0 })
  },

  setPower: (power) => set({ power }),

  shoot: () => {
    const { power, aimAngle } = get()
    set({
      isPowerCharging: false,
      isBallFlying: true,
      shotsRemaining: get().shotsRemaining - 1,
      hitBackboard: false,
      hitRim: false,
      shotResult: null,
    })
    return { power, aimAngle }
  },

  registerBackboardHit: () => set({ hitBackboard: true }),
  registerRimHit: () => set({ hitRim: true }),

  registerScore: () => {
    const { hitBackboard, hitRim } = get()
    let result: ShotResult
    if (!hitBackboard && !hitRim) {
      result = 'swish'
    } else if (hitBackboard) {
      result = 'backboard'
    } else {
      result = 'rim'
    }
    set({ shotResult: result, isBallFlying: false })
    return result
  },

  registerMiss: () => {
    set({ shotResult: 'miss', isBallFlying: false })
  },

  resetBall: () => {
    set({
      isBallFlying: false,
      shotResult: null,
      hitBackboard: false,
      hitRim: false,
      power: 0,
    })
  },

  decrementTime: () => {
    const t = get().timeRemaining - 1
    set({ timeRemaining: t })
    return t <= 0
  },

  resetGame: (totalShots?: number, timeSeconds?: number) => set({
    shotsRemaining: totalShots ?? BASKETBALL_CONFIG.totalShots,
    timeRemaining: timeSeconds ?? BASKETBALL_CONFIG.roundTimeSeconds,
    aimAngle: 0,
    power: 0,
    isPowerCharging: false,
    isBallFlying: false,
    shotResult: null,
    lastShotPoints: 0,
    hitBackboard: false,
    hitRim: false,
  }),
}))
