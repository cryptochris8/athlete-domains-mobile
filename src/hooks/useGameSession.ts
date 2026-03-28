import { useState, useCallback, useRef } from 'react'
import { useGameStore } from '@/stores/useGameStore'
import { useScoreStore } from '@/stores/useScoreStore'
import { audioManager } from '@/core/AudioManager'

interface Popup {
  id: number
  text: string
  position: [number, number, number]
  color: string
}

export function useGameSession() {
  const setGamePhase = useGameStore((s) => s.setGamePhase)
  const resetCurrentScore = useScoreStore((s) => s.resetCurrentScore)

  const [popups, setPopups] = useState<Popup[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const popupId = useRef(0)

  const initGame = useCallback((resetGameFn: () => void) => {
    resetCurrentScore()
    resetGameFn()
    setGamePhase('playing')
  }, [resetCurrentScore, setGamePhase])

  const addPopup = useCallback((text: string, position: [number, number, number], color: string) => {
    const id = ++popupId.current
    setPopups((prev) => [...prev, { id, text, position, color }])
    return id
  }, [])

  const removePopup = useCallback((id: number) => {
    setPopups((prev) => prev.filter((p) => p.id !== id))
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
