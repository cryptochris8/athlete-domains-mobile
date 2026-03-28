import { create } from 'zustand'
import { createInitialMatchState, type MatchState } from '@/systems/matchRules'

interface SoccerMatchStore {
  matchState: MatchState
  events: string[]
  shootPower: number
  isCharging: boolean
  kickoffCountdown: number | null
  setMatchState: (s: MatchState) => void
  pushEvents: (e: string[]) => void
  clearEvents: () => void
  setShootPower: (n: number) => void
  setIsCharging: (b: boolean) => void
  setKickoffCountdown: (n: number | null) => void
}

export const useSoccerMatchStore = create<SoccerMatchStore>((set) => ({
  matchState: createInitialMatchState(),
  events: [],
  shootPower: 0,
  isCharging: false,
  kickoffCountdown: null,
  setMatchState: (matchState) => set({ matchState }),
  pushEvents: (e) => set((s) => ({ events: [...s.events, ...e] })),
  clearEvents: () => set({ events: [] }),
  setShootPower: (shootPower) => set({ shootPower }),
  setIsCharging: (isCharging) => set({ isCharging }),
  setKickoffCountdown: (kickoffCountdown) => set({ kickoffCountdown }),
}))
