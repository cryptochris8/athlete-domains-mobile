import { useCallback, useRef, useReducer, useState } from 'react'
import { useGameStore } from '@/stores/useGameStore'
import { useScoreStore } from '@/stores/useScoreStore'
import { audioManager } from '@/core/AudioManager'

interface Popup {
  id: number
  text: string
  position: [number, number, number]
  color: string
}

type PopupAction =
  | { type: 'add'; popup: Popup }
  | { type: 'remove'; id: number }
  | { type: 'clear' }

function popupReducer(state: Popup[], action: PopupAction): Popup[] {
  switch (action.type) {
    case 'add': return [...state, action.popup]
    case 'remove': return state.filter((p) => p.id !== action.id)
    case 'clear': return []
  }
}

export function useGameSession() {
  const setGamePhase = useGameStore((s) => s.setGamePhase)
  const resetCurrentScore = useScoreStore((s) => s.resetCurrentScore)

  const [popups, dispatch] = useReducer(popupReducer, [])
  const [showConfetti, setShowConfetti] = useState(false)
  const popupId = useRef(0)

  const initGame = useCallback((resetGameFn: () => void) => {
    resetCurrentScore()
    resetGameFn()
    dispatch({ type: 'clear' })
    setGamePhase('playing')
  }, [resetCurrentScore, setGamePhase])

  const addPopup = useCallback((text: string, position: [number, number, number], color: string) => {
    const id = ++popupId.current
    dispatch({ type: 'add', popup: { id, text, position, color } })
    return id
  }, [])

  const removePopup = useCallback((id: number) => {
    dispatch({ type: 'remove', id })
  }, [])

  const triggerConfetti = useCallback((durationMs = 3000) => {
    setShowConfetti(true)
    audioManager.play('confetti')
    setTimeout(() => setShowConfetti(false), durationMs)
  }, [])

  const endGame = useCallback(() => {
    audioManager.playVoice('gameOver')
    setGamePhase('gameover')
  }, [setGamePhase])

  return {
    popups,
    showConfetti,
    addPopup,
    removePopup,
    triggerConfetti,
    initGame,
    endGame,
  }
}
