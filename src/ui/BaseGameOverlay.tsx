import { useCallback, type ReactNode } from 'react'
import { useGameStore } from '@/stores/useGameStore'
import { useScoreStore } from '@/stores/useScoreStore'
import { GameOverScreen } from '@/ui/GameOverScreen'
import type { Scene } from '@/types'

interface BaseGameOverlayProps {
  game: Scene
  children: ReactNode
  onPlayAgain: () => void
}

/**
 * Wraps the common overlay pattern shared by all game UIs:
 * - Renders children (HUD) when playing
 * - Renders GameOverScreen when gameover phase
 */
export function BaseGameOverlay({ game, children, onPlayAgain }: BaseGameOverlayProps) {
  const gamePhase = useGameStore((s) => s.gamePhase)

  return (
    <>
      {gamePhase === 'playing' && children}
      {gamePhase === 'gameover' && (
        <GameOverScreen game={game} onPlayAgain={onPlayAgain} />
      )}
    </>
  )
}

/**
 * Hook that returns standard handlers for play-again.
 */
export function useOverlayHandlers(resetGameFn: () => void, extraReset?: () => void) {
  const setGamePhase = useGameStore((s) => s.setGamePhase)
  const resetCurrentScore = useScoreStore((s) => s.resetCurrentScore)

  const handlePlayAgain = useCallback(() => {
    resetCurrentScore()
    resetGameFn()
    extraReset?.()
    setGamePhase('playing')
  }, [resetCurrentScore, resetGameFn, extraReset, setGamePhase])

  return { handlePlayAgain }
}
