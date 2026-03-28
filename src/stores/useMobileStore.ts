import { create } from 'zustand'
import { detectTouch } from '@/utils/mobile'

/** Mobile-specific configuration constants (Hytopia-inspired values) */
export const MOBILE_CONFIG = {
  /** Dead zone threshold — joystick input below this is ignored (scaled radial) */
  deadZone: 0.12,
  /** Force level that triggers sprinting (0-1 range) */
  sprintForceThreshold: 0.75,
  /** Walk force minimum — below this, no movement */
  walkForceThreshold: 0.1,
  /** Touch sensitivity for camera rotation (3.2x mouse, matching Hytopia) */
  touchSensitivity: 0.008,
  /** Left portion of screen reserved for movement joystick */
  moveZoneWidthPercent: 0.4,
  /** Joystick diameter in px */
  joystickSize: 130,
  /** Minimum button touch target in px (Apple HIG) */
  minTouchTarget: 48,
  /** Button press scale for feedback */
  buttonPressScale: 0.92,
  /** Haptic feedback duration in ms (0 = disabled) */
  hapticDurationMs: 10,
} as const

/**
 * Apply scaled radial dead zone to joystick input.
 * Remaps magnitude from [deadZone, 1] → [0, 1] smoothly.
 */
export function applyScaledRadialDeadZone(
  x: number,
  y: number,
  deadZone: number = MOBILE_CONFIG.deadZone,
): { x: number; y: number; magnitude: number } {
  const magnitude = Math.sqrt(x * x + y * y)
  if (magnitude < deadZone) return { x: 0, y: 0, magnitude: 0 }
  const scale = (magnitude - deadZone) / (1 - deadZone)
  const nx = (x / magnitude) * scale
  const ny = (y / magnitude) * scale
  return { x: nx, y: ny, magnitude: scale }
}

interface MobileState {
  isMobile: boolean
  joystickVector: { x: number; y: number }
  joystickForce: number
  isSprinting: boolean
  jumpRequested: boolean
  interactRequested: boolean
  shootHeld: boolean
  passHeld: boolean

  setMobile: (mobile: boolean) => void
  setJoystickVector: (x: number, y: number) => void
  setJoystickForce: (force: number) => void
  setSprinting: (sprinting: boolean) => void
  requestJump: () => void
  consumeJump: () => boolean
  requestInteract: () => void
  consumeInteract: () => boolean
  setShootHeld: (held: boolean) => void
  setPassHeld: (held: boolean) => void
  /** Reset all mobile input state — call on blur/pagehide/touchcancel */
  resetAllInput: () => void
}

export const useMobileStore = create<MobileState>((set, get) => ({
  isMobile: detectTouch(),
  joystickVector: { x: 0, y: 0 },
  joystickForce: 0,
  isSprinting: false,
  jumpRequested: false,
  interactRequested: false,
  shootHeld: false,
  passHeld: false,

  setMobile: (mobile) => set({ isMobile: mobile }),
  setJoystickVector: (x, y) => set({ joystickVector: { x, y } }),
  setJoystickForce: (force) => set({ joystickForce: force }),
  setSprinting: (sprinting) => set({ isSprinting: sprinting }),
  requestJump: () => set({ jumpRequested: true }),
  consumeJump: () => {
    if (get().jumpRequested) {
      set({ jumpRequested: false })
      return true
    }
    return false
  },
  setShootHeld: (held) => set({ shootHeld: held }),
  setPassHeld: (held) => set({ passHeld: held }),
  requestInteract: () => set({ interactRequested: true }),
  consumeInteract: () => {
    if (get().interactRequested) {
      set({ interactRequested: false })
      return true
    }
    return false
  },
  resetAllInput: () =>
    set({
      joystickVector: { x: 0, y: 0 },
      joystickForce: 0,
      isSprinting: false,
      jumpRequested: false,
      interactRequested: false,
      shootHeld: false,
      passHeld: false,
    }),
}))

// ── Global edge-case listeners ──
// Reset all mobile state when the app loses focus (prevents stuck inputs)
if (typeof window !== 'undefined') {
  const reset = () => useMobileStore.getState().resetAllInput()

  window.addEventListener('blur', reset)
  window.addEventListener('pagehide', reset)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') reset()
  })
  // touchcancel fires when OS interrupts touch (incoming call, gesture, etc.)
  window.addEventListener('touchcancel', reset)
  window.addEventListener('pointercancel', reset)
}
