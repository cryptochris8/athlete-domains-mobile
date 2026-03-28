import { useRef, useCallback } from 'react'
import {
  useMobileStore,
  applyScaledRadialDeadZone,
  MOBILE_CONFIG,
} from '@/stores/useMobileStore'

/**
 * Custom pointer-events joystick — replaces nipplejs for iOS WKWebView reliability.
 *
 * Uses setPointerCapture for robust drag tracking even when finger slides outside.
 * Pointer events + touch-action: none prevents pointercancel on iOS.
 */
export function MobileJoystick() {
  const containerRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef<HTMLDivElement>(null)
  const activePointer = useRef<number | null>(null)
  const origin = useRef({ x: 0, y: 0 })

  const RADIUS = MOBILE_CONFIG.joystickSize / 2 // max displacement
  const STICK_SIZE = 50
  const BASE_SIZE = MOBILE_CONFIG.joystickSize

  const updateInput = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - origin.current.x
    const dy = clientY - origin.current.y

    // Clamp to circle radius
    const dist = Math.sqrt(dx * dx + dy * dy)
    const clampedDist = Math.min(dist, RADIUS)
    const angle = Math.atan2(dy, dx)
    const cx = Math.cos(angle) * clampedDist
    const cy = Math.sin(angle) * clampedDist

    // Move the stick visual
    if (stickRef.current) {
      stickRef.current.style.transform = `translate(${cx}px, ${cy}px)`
    }

    // Normalize to -1..1 range
    const nx = cx / RADIUS
    const ny = cy / RADIUS

    // Apply dead zone (ny negated: screen-down = game-forward)
    const { x, y, magnitude } = applyScaledRadialDeadZone(nx, -ny)

    const store = useMobileStore.getState()
    store.setJoystickVector(x, y)
    store.setJoystickForce(magnitude)
  }, [RADIUS])

  const resetInput = useCallback(() => {
    if (stickRef.current) {
      stickRef.current.style.transform = 'translate(0px, 0px)'
    }
    if (baseRef.current) {
      baseRef.current.style.display = 'none'
    }
    const store = useMobileStore.getState()
    store.setJoystickVector(0, 0)
    store.setJoystickForce(0)
    activePointer.current = null
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (activePointer.current !== null) return // only one joystick at a time
    activePointer.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)

    // Position the joystick base at the touch point
    origin.current = { x: e.clientX, y: e.clientY }
    if (baseRef.current) {
      baseRef.current.style.left = `${e.clientX - BASE_SIZE / 2}px`
      baseRef.current.style.top = `${e.clientY - BASE_SIZE / 2}px`
      baseRef.current.style.display = 'flex'
    }
    if (stickRef.current) {
      stickRef.current.style.transform = 'translate(0px, 0px)'
    }
  }, [BASE_SIZE])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== activePointer.current) return
    updateInput(e.clientX, e.clientY)
  }, [updateInput])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== activePointer.current) return
    resetInput()
  }, [resetInput])

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== activePointer.current) return
    resetInput()
  }, [resetInput])

  return (
    <>
      {/* Touch capture zone — left side of screen */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: `${MOBILE_CONFIG.moveZoneWidthPercent * 100}vw`,
          height: '100vh',
          zIndex: 50,
          pointerEvents: 'auto',
          touchAction: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        } as React.CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />

      {/* Joystick visual — rendered at touch point, outside capture zone for layering */}
      <div
        ref={baseRef}
        style={{
          display: 'none',
          position: 'fixed',
          width: `${BASE_SIZE}px`,
          height: `${BASE_SIZE}px`,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.12)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 51,
          pointerEvents: 'none',
        }}
      >
        <div
          ref={stickRef}
          style={{
            width: `${STICK_SIZE}px`,
            height: `${STICK_SIZE}px`,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.45)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            transition: 'none',
            willChange: 'transform',
          }}
        />
      </div>
    </>
  )
}
