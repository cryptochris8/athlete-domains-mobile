import { useEffect } from 'react'
import { useGameStore } from '@/stores/useGameStore'

/**
 * Global keyboard handler for pause (Escape key).
 * Call once in each game scene or at app level.
 */
export function useGameKeyboard() {
  const gamePhase = useGameStore((s) => s.gamePhase)
  const setGamePhase = useGameStore((s) => s.setGamePhase)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gamePhase === 'playing') {
          setGamePhase('paused')
        } else if (gamePhase === 'paused') {
          setGamePhase('playing')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gamePhase, setGamePhase])
}
