/**
 * Simple haptic feedback for mobile devices.
 * Falls back to no-op on unsupported platforms.
 */

export function hapticLight() {
  try { navigator.vibrate?.(10) } catch { /* unsupported */ }
}

export function hapticMedium() {
  try { navigator.vibrate?.(25) } catch { /* unsupported */ }
}

export function hapticHeavy() {
  try { navigator.vibrate?.(50) } catch { /* unsupported */ }
}

export function hapticSuccess() {
  try { navigator.vibrate?.([15, 50, 15]) } catch { /* unsupported */ }
}

export function hapticError() {
  try { navigator.vibrate?.([40, 30, 40]) } catch { /* unsupported */ }
}
