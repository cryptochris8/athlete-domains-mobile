// ── Touch Detection ────────────────────────────────────────────
/** Eagerly detect touch support — single source of truth for the whole app */
export function detectTouch(): boolean {
  if (typeof window === 'undefined') return false
  if ('ontouchstart' in window) return true
  if (navigator.maxTouchPoints > 0) return true
  if (window.matchMedia?.('(pointer: coarse)').matches) return true
  return false
}

// ── Haptic Feedback ────────────────────────────────────────────
/** Trigger short haptic feedback via Vibration API. Silent no-op on iOS WKWebView. */
export function haptic() {
  if (MOBILE_BUTTON_CONFIG.hapticDurationMs > 0 && navigator.vibrate) {
    navigator.vibrate(MOBILE_BUTTON_CONFIG.hapticDurationMs)
  }
}

// ── Button Config ──────────────────────────────────────────────
export const MOBILE_BUTTON_CONFIG = {
  /** Button press scale for feedback */
  buttonPressScale: 0.92,
  /** Haptic feedback duration in ms (0 = disabled) */
  hapticDurationMs: 10,
  /** Button size tokens */
  sizes: {
    primary: 72,    // Shoot, Talk (most important action)
    secondary: 64,  // Pass, Jump
  },
} as const

// ── Shared Button Style ────────────────────────────────────────
export const BTN_BASE: React.CSSProperties = {
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.25)',
  background: 'rgba(0,0,0,0.65)',
  color: '#fff',
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'auto' as const,
  userSelect: 'none' as const,
  WebkitUserSelect: 'none' as const,
  touchAction: 'none',
  cursor: 'pointer',
  transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), background 0.15s ease',
}
