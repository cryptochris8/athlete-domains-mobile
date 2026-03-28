import { useEffect } from 'react'
import { useMobileStore } from '@/stores/useMobileStore'
import { detectTouch } from '@/utils/mobile'

/** Check if the device supports touch input */
export function isTouchDevice(): boolean {
  return detectTouch()
}

/** Hook that detects touch device and sets useMobileStore.isMobile */
export function useTouchDevice(): boolean {
  const isMobile = useMobileStore((s) => s.isMobile)
  const setMobile = useMobileStore((s) => s.setMobile)

  useEffect(() => {
    if (isTouchDevice()) {
      setMobile(true)
      return
    }
    // Hybrid device fallback: detect first touch event
    const onFirstTouch = () => {
      setMobile(true)
      window.removeEventListener('touchstart', onFirstTouch)
    }
    window.addEventListener('touchstart', onFirstTouch, { once: true })
    return () => window.removeEventListener('touchstart', onFirstTouch)
  }, [setMobile])

  return isMobile
}
