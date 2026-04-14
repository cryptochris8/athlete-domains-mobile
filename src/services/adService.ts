import type { AdPlacement } from '@/types/monetization'
import { trackAdWatched } from './analyticsService'

// Detect if we're running in Capacitor native context
function isNative(): boolean {
  return 'Capacitor' in window
}

// ── Ad frequency capping ──────────────────────────────
const MAX_ADS_PER_DAY = 10
const AD_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes between ads

interface AdCap {
  count: number
  date: string
  lastShownAt: number
}

function getAdCap(): AdCap {
  try {
    const raw = localStorage.getItem('ad-ios-ad-cap')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { count: 0, date: '', lastShownAt: 0 }
}

function getTodayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function canShowAd(): boolean {
  const cap = getAdCap()
  const today = getTodayLocal()
  // Reset counter on new day
  if (cap.date !== today) return true
  // Check daily limit
  if (cap.count >= MAX_ADS_PER_DAY) return false
  // Check cooldown
  if (Date.now() - cap.lastShownAt < AD_COOLDOWN_MS) return false
  return true
}

function recordAdShown(): void {
  const cap = getAdCap()
  const today = getTodayLocal()
  const newCap: AdCap = {
    count: cap.date === today ? cap.count + 1 : 1,
    date: today,
    lastShownAt: Date.now(),
  }
  localStorage.setItem('ad-ios-ad-cap', JSON.stringify(newCap))
}

/**
 * Initialize AdMob. No-op in browser.
 */
export async function initializeAds(): Promise<void> {
  if (!isNative()) return
  try {
    const { AdMob } = await Function('return import("@capacitor-community/admob")')()
    await AdMob.initialize({ initializeForTesting: true })
  } catch (e) {
    console.warn('[AdService] Init failed:', e)
  }
}

/**
 * Prepare a rewarded ad for a placement.
 */
let lastPlacement: AdPlacement = 'double_coins'

export async function prepareRewardedAd(_placement: AdPlacement): Promise<boolean> {
  lastPlacement = _placement
  if (!isNative()) return false
  try {
    const { AdMob } = await Function('return import("@capacitor-community/admob")')()
    await AdMob.prepareRewardVideoAd({
      adId: 'ca-app-pub-3940256099942544/5224354917',
      isTesting: true,
    })
    return true
  } catch {
    return false
  }
}

/**
 * Show a rewarded ad. Returns true if the user completed the ad and earned the reward.
 * In browser/dev mode, auto-rewards (stub).
 * Enforces daily cap and cooldown between ads.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (!canShowAd()) {
    console.log('[AdService] Ad capped — daily limit or cooldown active')
    return false
  }

  if (!isNative()) {
    console.log('[AdService] Stub: rewarding user (no native ad plugin)')
    recordAdShown()
    trackAdWatched(lastPlacement)
    return true
  }
  try {
    const { AdMob } = await Function('return import("@capacitor-community/admob")')()
    const result = await AdMob.showRewardVideoAd()
    if (result) {
      recordAdShown()
      trackAdWatched(lastPlacement)
    }
    return !!result
  } catch {
    return false
  }
}

/** Check if an ad can be shown (for UI: hide/disable ad buttons when capped). */
export function isAdAvailable(): boolean {
  return canShowAd()
}
