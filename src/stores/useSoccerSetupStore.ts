import { create } from 'zustand'

export interface SoccerSetupState {
  playerCount: 1 | 2
  player1Team: 'home' | 'away'
  player2Team: 'home' | 'away'
  setPlayerCount: (count: 1 | 2) => void
  setPlayer1Team: (team: 'home' | 'away') => void
  reset: () => void
}

export const useSoccerSetupStore = create<SoccerSetupState>((set) => ({
  playerCount: 1,
  player1Team: 'home',
  player2Team: 'away',
  setPlayerCount: (count) => set({ playerCount: count }),
  setPlayer1Team: (team) =>
    set({
      player1Team: team,
      player2Team: team === 'home' ? 'away' : 'home',
    }),
  reset: () =>
    set({
      playerCount: 1,
      player1Team: 'home',
      player2Team: 'away',
    }),
}))
