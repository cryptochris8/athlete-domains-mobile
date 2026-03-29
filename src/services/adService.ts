import type { AdPlacement } from '@/types/monetization'

// Ad unit IDs — use test IDs during development
const AD_UNIT_IDS: Record<AdPlacement, string> = {
  double_coins: 'ca-app-pub-3940256099942544/5224354917',     // Google test ID
  free_pack: 'ca-app-pub-3940256099942544/5224354917',
  boost_daily: 'ca-app-pub-3940256099942544/5224354917',
  retry_after_loss: 'ca-app-pub-3940256099942544/5224354917',
}

let adMobPlugin: typeof import('@capacitor-community/admob') | null = null

async function getAdMob() {
  if (adMobPlugin) return adMobPlugin
  try {
    adMobPlugin = await import('@capacitor-community/admob')
    return adMobPlugin
  } catch {
    return null
  }
}

/**
 * Initialize AdMob. Call once at app startup.
 */
export async function initializeAds(): Promise<void> {
  const admob = await getAdMob()
  if (!admob) return
  try {
    await admob.AdMob.initialize({
      initializeForTesting: true,
    })
  } catch (e) {
    console.warn('[AdService] Init failed:', e)
  }
}

/**
 * Prepare a rewarded ad for a placement.
 */
export async function prepareRewardedAd(placement: AdPlacement): Promise<boolean> {
  const admob = await getAdMob()
  if (!admob) return false
  try {
    await admob.AdMob.prepareRewardVideoAd({
      adId: AD_UNIT_IDS[placement],
      isTesting: true,
    })
    return true
  } catch {
    return false
  }
}

/**
 * Show a rewarded ad. Returns true if the user completed the ad and earned the reward.
 */
export async function showRewardedAd(): Promise<boolean> {
  const admob = await getAdMob()
  if (!admob) {
    // Stub: auto-reward in dev/browser
    console.log('[AdService] Stub: rewarding user (no native ad plugin)')
    return true
  }
  try {
    const result = await admob.AdMob.showRewardVideoAd()
    return !!result
  } catch {
    return false
  }
}
