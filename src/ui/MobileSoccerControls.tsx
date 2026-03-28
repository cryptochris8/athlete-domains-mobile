import { useState, useCallback } from 'react'
import { useMobileStore } from '@/stores/useMobileStore'
import { haptic, BTN_BASE, MOBILE_BUTTON_CONFIG } from '@/utils/mobile'

export function MobileSoccerControls() {
  const [shootPressed, setShootPressed] = useState(false)
  const [passPressed, setPassPressed] = useState(false)

  const pressScale = { transform: `scale(${MOBILE_BUTTON_CONFIG.buttonPressScale})` }

  const handlePassStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setPassPressed(true)
    haptic()
    useMobileStore.getState().setPassHeld(true)
  }, [])

  const handlePassEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    setPassPressed(false)
    useMobileStore.getState().setPassHeld(false)
  }, [])

  const handleShootStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setShootPressed(true)
    haptic()
    useMobileStore.getState().setShootHeld(true)
  }, [])

  const handleShootEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    setShootPressed(false)
    useMobileStore.getState().setShootHeld(false)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
      right: 'calc(20px + env(safe-area-inset-right, 0px))',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      alignItems: 'center',
      zIndex: 50,
      pointerEvents: 'none',
    }}>
      {/* Pass button */}
      <button
        style={{
          ...BTN_BASE,
          width: `${MOBILE_BUTTON_CONFIG.sizes.secondary}px`,
          height: `${MOBILE_BUTTON_CONFIG.sizes.secondary}px`,
          background: passPressed
            ? 'rgba(21, 101, 192, 0.85)'
            : 'rgba(33, 150, 243, 0.7)',
          border: '2px solid rgba(255,255,255,0.4)',
          ...(passPressed ? pressScale : {}),
        }}
        onTouchStart={handlePassStart}
        onTouchEnd={handlePassEnd}
        onTouchCancel={handlePassEnd}
      >
        Pass
      </button>

      {/* Shoot button — hold to charge, release to shoot */}
      <button
        style={{
          ...BTN_BASE,
          width: `${MOBILE_BUTTON_CONFIG.sizes.primary}px`,
          height: `${MOBILE_BUTTON_CONFIG.sizes.primary}px`,
          background: shootPressed
            ? 'rgba(198, 40, 40, 0.85)'
            : 'rgba(244, 67, 54, 0.7)',
          border: '2px solid rgba(255,255,255,0.4)',
          ...(shootPressed ? pressScale : {}),
        }}
        onTouchStart={handleShootStart}
        onTouchEnd={handleShootEnd}
        onTouchCancel={handleShootEnd}
      >
        Shoot
      </button>
    </div>
  )
}
