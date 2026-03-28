import { create } from 'zustand'
import type { Scene, GamePhase, Difficulty } from '@/types'
import type { GameMode } from '@/systems/gameModes'
import { useMobileStore } from '@/stores/useMobileStore'

interface GameState {
  currentScene: Scene
  gamePhase: GamePhase
  isLoading: boolean
  selectedDifficulty: Difficulty
  gameMode: GameMode
  setScene: (scene: Scene) => void
  setGamePhase: (phase: GamePhase) => void
  setLoading: (loading: boolean) => void
  setSelectedDifficulty: (d: Difficulty) => void
  setGameMode: (mode: GameMode) => void
  returnToMenu: () => void
}

export const useGameStore = create<GameState>((set) => ({
  currentScene: 'menu',
  gamePhase: 'menu',
  isLoading: false,
  selectedDifficulty: 'medium',
  gameMode: 'classic',

  setScene: (scene) => {
    useMobileStore.getState().resetAllInput()
    set({ currentScene: scene, gamePhase: scene === 'menu' ? 'menu' : 'playing' })
  },
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSelectedDifficulty: (d) => set({ selectedDifficulty: d }),
  setGameMode: (mode) => set({ gameMode: mode }),
  returnToMenu: () => {
    useMobileStore.getState().resetAllInput()
    set({ currentScene: 'menu', gamePhase: 'menu' })
  },
}))
