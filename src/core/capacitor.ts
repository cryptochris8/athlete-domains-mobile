import { Capacitor } from '@capacitor/core'

// ── Platform detection ─────────────────────────────────────────────
export const isNative = Capacitor.isNativePlatform()
export const isIOS = Capacitor.getPlatform() === 'ios'
export const isWeb = Capacitor.getPlatform() === 'web'

// ── Audio unlock (iOS suspends AudioContext until user gesture) ────
export function setupAudioUnlock() {
  if (!isIOS) return

  const unlock = () => {
    // Howler.js exposes the shared AudioContext on the global Howler object
    const ctx = (window as any).Howler?.ctx as AudioContext | undefined
    if (ctx && ctx.state === 'suspended') {
      ctx.resume()
    }
    document.removeEventListener('touchstart', unlock)
    document.removeEventListener('click', unlock)
  }

  document.addEventListener('touchstart', unlock, { once: true })
  document.addEventListener('click', unlock, { once: true })
}

// ── App lifecycle (pause/resume audio on background/foreground) ───
export async function setupAppLifecycle() {
  if (!isNative) return

  const { App } = await import('@capacitor/app')
  const { audioManager } = await import('./AudioManager')

  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) {
      // Stop all audio when app goes to background
      audioManager.stopAll()
    } else {
      // Resume music on foreground — App.tsx's useEffect only fires on scene change
      audioManager.resumeMusic()
    }
  })
}

// ── Orientation lock (landscape only) ─────────────────────────────
export async function lockLandscape() {
  if (!isNative) return

  const { ScreenOrientation } = await import('@capacitor/screen-orientation')
  await ScreenOrientation.lock({ orientation: 'landscape' })
}

// ── Status bar setup ──────────────────────────────────────────────
export async function setupStatusBar() {
  if (!isNative) return

  const { StatusBar, Style } = await import('@capacitor/status-bar')
  await StatusBar.setStyle({ style: Style.Dark })
  await StatusBar.setOverlaysWebView({ overlay: true })
}

// ── Splash screen ─────────────────────────────────────────────────
export async function hideSplashScreen() {
  if (!isNative) return

  const { SplashScreen } = await import('@capacitor/splash-screen')
  await SplashScreen.hide()
}
