import { useRef, useCallback, useEffect } from 'react'

/**
 * Manages the 3-2-1 kickoff countdown with proper cleanup.
 *
 * Returns:
 * - `kickoffFreezeUntil` ref — performance.now() timestamp until which play is frozen
 * - `startCountdown(freezeDurationMs?)` — triggers a 3-2-1 countdown (default 3000ms freeze)
 * - cleanup on unmount (clears all pending timeouts)
 */
export function useKickoffCountdown(
  setKickoffCountdown: (value: number | null) => void,
) {
  const isMounted = useRef(true)
  const kickoffFreezeUntil = useRef(0)
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([])

  // Unmount guard — clears all pending timers
  useEffect(() => {
    return () => {
      isMounted.current = false
      for (const id of timerIds.current) clearTimeout(id)
      timerIds.current = []
    }
  }, [])

  /**
   * Start a kickoff countdown. Sets the freeze-until timestamp and schedules
   * the 3 → 2 → 1 → null countdown updates.
   *
   * @param freezeDurationMs How long to freeze play (default 3000ms)
   */
  const startCountdown = useCallback(
    (freezeDurationMs = 3000) => {
      kickoffFreezeUntil.current = performance.now() + freezeDurationMs
      setKickoffCountdown(3)
      timerIds.current.push(
        setTimeout(() => { if (isMounted.current) setKickoffCountdown(2) }, 1000),
        setTimeout(() => { if (isMounted.current) setKickoffCountdown(1) }, 2000),
        setTimeout(() => { if (isMounted.current) setKickoffCountdown(null) }, 3000),
      )
    },
    [setKickoffCountdown],
  )

  /**
   * Schedule a delayed action with automatic cleanup on unmount.
   * Returns the timer ID in case the caller wants to track it.
   */
  const scheduleTimer = useCallback(
    (fn: () => void, delayMs: number) => {
      const id = setTimeout(() => {
        if (isMounted.current) fn()
      }, delayMs)
      timerIds.current.push(id)
      return id
    },
    [],
  )

  return {
    isMounted,
    kickoffFreezeUntil,
    timerIds,
    startCountdown,
    scheduleTimer,
  }
}
