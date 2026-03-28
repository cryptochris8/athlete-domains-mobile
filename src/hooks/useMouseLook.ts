import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { HUB } from '@/core/constants'
import { isTouchDevice } from '@/hooks/useTouchDevice'
import { MOBILE_CONFIG } from '@/stores/useMobileStore'

export function useMouseLook() {
  const yaw = useRef<number>(0)
  const pitch = useRef<number>(HUB.cameraPitchDefault)
  const { gl } = useThree()

  useEffect(() => {
    const canvas = gl.domElement
    const mobile = isTouchDevice()

    if (!mobile) {
      const onMouseMove = (e: MouseEvent) => {
        if (document.pointerLockElement !== canvas) return
        yaw.current -= e.movementX * HUB.mouseSensitivity
        pitch.current = Math.max(
          HUB.cameraPitchMin,
          Math.min(HUB.cameraPitchMax, pitch.current - e.movementY * HUB.mouseSensitivity),
        )
      }

      const requestLock = () => {
        if (document.pointerLockElement !== canvas) {
          const result = canvas.requestPointerLock() as void | Promise<void>
          if (result instanceof Promise) result.catch(() => {})
        }
      }

      const autoLockTimer = setTimeout(() => requestLock(), 100)
      const onClick = () => requestLock()

      canvas.addEventListener('click', onClick)
      document.addEventListener('mousemove', onMouseMove)

      return () => {
        clearTimeout(autoLockTimer)
        canvas.removeEventListener('click', onClick)
        document.removeEventListener('mousemove', onMouseMove)
        if (document.pointerLockElement) document.exitPointerLock()
      }
    } else {
      let activeTouchId: number | null = null
      let lastTouchX = 0
      let lastTouchY = 0
      const moveZoneCutoff = MOBILE_CONFIG.moveZoneWidthPercent

      const onTouchStart = (e: TouchEvent) => {
        if (activeTouchId !== null) return
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i]
          if (touch.clientX > window.innerWidth * moveZoneCutoff) {
            activeTouchId = touch.identifier
            lastTouchX = touch.clientX
            lastTouchY = touch.clientY
            break
          }
        }
      }

      const onTouchMove = (e: TouchEvent) => {
        if (activeTouchId === null) return
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i]
          if (touch.identifier === activeTouchId) {
            const dx = touch.clientX - lastTouchX
            const dy = touch.clientY - lastTouchY
            yaw.current -= dx * HUB.touchSensitivity
            pitch.current = Math.max(
              HUB.cameraPitchMin,
              Math.min(HUB.cameraPitchMax, pitch.current - dy * HUB.touchSensitivity),
            )
            lastTouchX = touch.clientX
            lastTouchY = touch.clientY
            break
          }
        }
      }

      const onTouchEnd = (e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId) {
            activeTouchId = null
            break
          }
        }
      }

      const onTouchCancel = (e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId) {
            activeTouchId = null
            break
          }
        }
      }

      canvas.addEventListener('touchstart', onTouchStart, { passive: true })
      canvas.addEventListener('touchmove', onTouchMove, { passive: true })
      canvas.addEventListener('touchend', onTouchEnd, { passive: true })
      canvas.addEventListener('touchcancel', onTouchCancel, { passive: true })

      return () => {
        canvas.removeEventListener('touchstart', onTouchStart)
        canvas.removeEventListener('touchmove', onTouchMove)
        canvas.removeEventListener('touchend', onTouchEnd)
        canvas.removeEventListener('touchcancel', onTouchCancel)
      }
    }
  }, [gl.domElement])

  return { yaw, pitch }
}
