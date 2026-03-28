import { useState, useCallback } from 'react'
import { useMobileStore } from '@/stores/useMobileStore'
import { haptic, BTN_BASE, MOBILE_BUTTON_CONFIG } from '@/utils/mobile'

interface MobileControlsProps {
  showInteract?: boolean
  onInteract?: () => void
}

export function MobileControls({ showInteract, onInteract }: MobileControlsProps) {
  const requestJump = useMobileStore((s) => s.requestJump)

  const [jumpPressed, setJumpPressed] = useState(false)
  const [talkPressed, setTalkPressed] = useState(false)

  const pressScale = { transform: `scale(${MOBILE_BUTTON_CONFIG.buttonPressScale})` }

  const handleJumpStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setJumpPressed(true)
    haptic()
    requestJump()
  }, [requestJump])

  const handleJumpEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    setJumpPressed(false)
  }, [])

  const handleTalkStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setTalkPressed(true)
    haptic()
    onInteract?.()
  }, [onInteract])

  const handleTalkEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    setTalkPressed(false)
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
      {showInteract && (
        <button
          style={{
            ...BTN_BASE,
            width: `${MOBILE_BUTTON_CONFIG.sizes.primary}px`,
            height: `${MOBILE_BUTTON_CONFIG.sizes.primary}px`,
            background: talkPressed
              ? 'rgba(56, 142, 60, 0.85)'
              : 'rgba(76, 175, 80, 0.7)',
            border: '2px solid rgba(255,255,255,0.4)',
            fontSize: '0.65rem',
            ...(talkPressed ? pressScale : {}),
          }}
          onTouchStart={handleTalkStart}
          onTouchEnd={handleTalkEnd}
          onTouchCancel={handleTalkEnd}
        >
          Talk
        </button>
      )}

      <button
        style={{
          ...BTN_BASE,
          width: `${MOBILE_BUTTON_CONFIG.sizes.secondary}px`,
          height: `${MOBILE_BUTTON_CONFIG.sizes.secondary}px`,
          background: jumpPressed
            ? 'rgba(200, 40, 40, 0.85)'
            : 'rgba(0,0,0,0.65)',
          ...(jumpPressed ? pressScale : {}),
        }}
        onTouchStart={handleJumpStart}
        onTouchEnd={handleJumpEnd}
        onTouchCancel={handleJumpEnd}
      >
        Jump
      </button>
    </div>
  )
}
