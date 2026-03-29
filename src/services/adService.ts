import type { AdPlacement } from '@/types/monetization'

// Detect if we're running in Capacitor native context
function isNative(): boolean {
  return 'Capacitor' in window
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
export async function prepareRewardedAd(_placement: AdPlacement): Promise<boolean> {
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
 */
export async function showRewardedAd(): Promise<boolean> {
  if (!isNative()) {
    console.log('[AdService] Stub: rewarding user (no native ad plugin)')
    return true
  }
  try {
    const { AdMob } = await Function('return import("@capacitor-community/admob")')()
    const result = await AdMob.showRewardVideoAd()
    return !!result
  } catch {
    return false
  }
}
