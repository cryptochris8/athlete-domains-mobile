import { useEffect } from 'react'
import { audioManager } from '@/core/AudioManager'
import type { MusicName } from '@/core/AudioManager'
import { useGameSession } from '@/hooks/useGameSession'
import { useGameKeyboard } from '@/hooks/useGameKeyboard'

/**
 * Consolidates per-scene boilerplate: music, init, keyboard, and session management.
 */
export function useGameScene(musicTrack: MusicName, resetGameFn: () => void) {
  const session = useGameSession()
  useGameKeyboard()

  useEffect(() => {
    audioManager.playMusic(musicTrack)
  }, [musicTrack])

  useEffect(() => {
    session.initGame(resetGameFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return session
}
