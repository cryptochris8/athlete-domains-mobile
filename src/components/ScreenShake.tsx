import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

interface ScreenShakeProps {
  /** Shake intensity in world units */
  intensity?: number
  /** Shake duration in seconds */
  duration?: number
  /** Set to true to trigger a shake */
  active: boolean
}

/**
 * Applies a camera offset shake when `active` flips to true.
 * Decays over `duration` seconds.
 */
export function ScreenShake({ intensity = 0.15, duration = 0.3, active }: ScreenShakeProps) {
  const { camera } = useThree()
  const startTime = useRef(-1)
  const prevActive = useRef(false)

  useFrame((state) => {
    // Detect rising edge
    if (active && !prevActive.current) {
      startTime.current = state.clock.elapsedTime
    }
    prevActive.current = active

    // Skip per-frame work when not shaking
    if (startTime.current < 0) return
    const elapsed = state.clock.elapsedTime - startTime.current

    if (elapsed > duration) {
      startTime.current = -1
      return
    }

    const decay = 1 - elapsed / duration
    const shakeX = (Math.random() - 0.5) * 2 * intensity * decay
    const shakeY = (Math.random() - 0.5) * 2 * intensity * decay

    camera.position.x += shakeX
    camera.position.y += shakeY
  })

  return null
}
