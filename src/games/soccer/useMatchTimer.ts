import { useRef, useCallback } from 'react'
import {
  tickMatch,
  startSecondHalf,
  type MatchState,
} from '@/systems/matchRules'


export interface MatchTimerCallbacks {
  onHalftime: () => void
  onMatchEnd: () => void
  onStoppageTime: () => void
  onTicking: () => void
  onSecondHalfStart: (nextState: MatchState) => void
}

/**
 * Extracts match timer logic: tick accumulation, halftime pause countdown,
 * and match event dispatching (halftime, match-end, stoppage-time, ticking).
 *
 * Call `updateTimer(delta, matchRef, setMatchState, pushEvents)` every frame
 * from within a useFrame callback when `gamePhase === 'playing'`.
 */
export function useMatchTimer(callbacks: MatchTimerCallbacks) {
  const tickAccum = useRef(0)
  const halftimeTimer = useRef(0)

  /**
   * Advance the match timer by `delta` seconds.
   * Mutates `matchRef.current` in place and calls `setMatchState` / `pushEvents`.
   */
  const updateTimer = useCallback(
    (
      delta: number,
      matchRef: React.MutableRefObject<MatchState>,
      setMatchState: (s: MatchState) => void,
      pushEvents: (e: string[]) => void,
    ) => {
      const ms = matchRef.current.status

      // Halftime pause — wait 5 seconds then start second half
      if (ms === 'halftime') {
        halftimeTimer.current += delta
        if (halftimeTimer.current > 5) {
          halftimeTimer.current = 0
          const next = startSecondHalf(matchRef.current)
          matchRef.current = next
          setMatchState(next)
          pushEvents(['second-half-start'])
          callbacks.onSecondHalfStart(next)
        }
      }

      // Match timer tick — runs during active play phases
      if (ms === 'first-half' || ms === 'second-half' || ms === 'overtime') {
        tickAccum.current += delta
        if (tickAccum.current >= 1) {
          tickAccum.current -= 1
          const result = tickMatch(matchRef.current)
          matchRef.current = result.state
          setMatchState(result.state)
          if (result.events.length > 0) {
            pushEvents(result.events)
            for (const evt of result.events) {
              if (evt === 'halftime') {
                callbacks.onHalftime()
              }
              if (evt === 'match-end') {
                callbacks.onMatchEnd()
              }
              if (evt.startsWith('ticking')) callbacks.onTicking()
              if (evt.startsWith('stoppage-time')) callbacks.onStoppageTime()
            }
          }
        }
      }
    },
    [callbacks],
  )

  return { updateTimer }
}
