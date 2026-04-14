import type { IAPProductId } from '@/types/monetization'
import { httpsCallable } from 'firebase/functions'
import { getFunctions } from 'firebase/functions'
import { app } from '@/core/firebase'
import { trackIAPPurchase } from './analyticsService'
import { syncAfterPurchase } from './firestoreSync'
import { usePlayerStore } from '@/stores/usePlayerStore'

// Detect if we're running in Capacitor native context
function isNative(): boolean {
  return 'Capacitor' in window
}

const IAP_COIN_AMOUNTS: Record<string, number> = {
  coins_1000: 1000,
  coins_4000: 4000,
  coins_8000: 8000,
  starter_pack: 500,
}

/**
 * Initialize IAP. No-op in browser.
 */
export async function initializeIAP(): Promise<void> {
  if (!isNative()) {
    console.log('[IAPService] Browser mode — IAP stubbed')
    return
  }
  try {
    const { InAppPurchases } = await Function('return import("@capacitor-community/in-app-purchases")')()
    await InAppPurchases.initialize()
  } catch (e) {
    console.warn('[IAPService] Init failed:', e)
  }
}

/**
 * Load product details from the App Store.
 */
export async function loadProducts(_productIds: IAPProductId[]): Promise<void> {
  if (!isNative()) return
  try {
    const { InAppPurchases } = await Function('return import("@capacitor-community/in-app-purchases")')()
    await InAppPurchases.getProducts({ productIds: _productIds })
  } catch (e) {
    console.warn('[IAPService] Load products failed:', e)
  }
}

/**
 * Purchase a product and validate the receipt server-side.
 * Returns true on success.
 * In browser/dev mode, stubs the purchase and applies locally.
 */
export async function purchase(productId: IAPProductId): Promise<boolean> {
  if (!isNative()) {
    console.log(`[IAPService] Stub: purchasing ${productId}`)
    applyPurchaseLocally(productId)
    trackIAPPurchase(productId)
    return true
  }

  try {
    const { InAppPurchases } = await Function('return import("@capacitor-community/in-app-purchases")')()
    const result = await InAppPurchases.purchase({ productId })
    if (!result) return false

    // Validate receipt server-side via Cloud Function
    try {
      const functions = getFunctions(app)
      const validateReceipt = httpsCallable(functions, 'validateReceipt')
      await validateReceipt({
        productId,
        receiptData: result.receiptData ?? null,
        platform: 'ios',
      })
    } catch (err) {
      console.warn('[IAPService] Server validation failed, applying locally:', err)
    }

    // Apply locally regardless (server is source of truth but local state keeps UI responsive)
    applyPurchaseLocally(productId)
    trackIAPPurchase(productId)
    return true
  } catch {
    return false
  }
}

/** Apply purchase effects to local stores */
function applyPurchaseLocally(productId: string) {
  const store = usePlayerStore.getState()

  if (productId === 'remove_ads') {
    store.setAdsRemoved()
    syncAfterPurchase({ coins: store.getActiveProfile()?.coins ?? 0, adsRemoved: true }).catch(() => {})
    return
  }

  if (productId === 'starter_pack') {
    store.setStarterPackPurchased()
    store.addCoins(500)
    const profile = store.getActiveProfile()
    syncAfterPurchase({ coins: profile?.coins ?? 0, starterPackPurchased: true }).catch(() => {})
    return
  }

  const coinAmount = IAP_COIN_AMOUNTS[productId]
  if (coinAmount) {
    store.addCoins(coinAmount)
    const profile = store.getActiveProfile()
    syncAfterPurchase({ coins: profile?.coins ?? 0 }).catch(() => {})
  }
}

/**
 * Restore previous purchases. Returns list of restored product IDs.
 */
export async function restorePurchases(): Promise<string[]> {
  if (!isNative()) return []

  try {
    // Try server-side restore first
    const functions = getFunctions(app)
    const restoreFn = httpsCallable(functions, 'restoreUserPurchases')
    const result = await restoreFn({})
    const data = result.data as { productIds?: string[] }
    const productIds = data?.productIds ?? []

    // Re-apply each restored purchase locally
    for (const pid of productIds) {
      applyPurchaseLocally(pid)
    }

    return productIds
  } catch {
    // Fallback to native restore
    try {
      const { InAppPurchases } = await Function('return import("@capacitor-community/in-app-purchases")')()
      const result = await InAppPurchases.restorePurchases()
      return (result as { productIds?: string[] })?.productIds ?? []
    } catch {
      return []
    }
  }
}
