import { useState, useEffect, useCallback, useRef } from 'react'

interface UseTimerOptions {
  initialSeconds: number
  autoStart?: boolean
  onExpire?: () => void
}

export function useTimer({ initialSeconds, autoStart = false, onExpire }: UseTimerOptions) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const onExpireRef = useRef(onExpire)
  const startTimeRef = useRef<number>(0)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!isRunning) return
    if (seconds <= 0) {
      setIsRunning(false)
      onExpireRef.current?.()
      return
    }

    // Use Date.now() to avoid drift - track when this tick started
    startTimeRef.current = Date.now()

    const timer = setTimeout(() => {
      setSeconds((s) => {
        const next = s - 1
        if (next <= 0) {
          setIsRunning(false)
          // Defer callback to avoid state update during render
          queueMicrotask(() => onExpireRef.current?.())
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [seconds, isRunning])

  // Correct for drift: when the tab was backgrounded, multiple seconds may have passed
  useEffect(() => {
    if (!isRunning) return

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && startTimeRef.current > 0) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        if (elapsed > 1) {
          // Correct for missed ticks while tab was backgrounded
          setSeconds((s) => Math.max(0, s - (elapsed - 1)))
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isRunning])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => setIsRunning(false), [])

  const reset = useCallback(() => {
    setSeconds(initialSeconds)
    setIsRunning(false)
  }, [initialSeconds])

  return { seconds, isRunning, start, pause, reset }
}
