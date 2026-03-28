import { create } from 'zustand'

interface BasketballUIState {
  hasPowerShot: boolean
  setHasPowerShot: (v: boolean) => void
}

export const useBasketballUI = create<BasketballUIState>((set) => ({
  hasPowerShot: false,
  setHasPowerShot: (v) => set({ hasPowerShot: v }),
}))
