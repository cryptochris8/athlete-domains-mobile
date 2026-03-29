import type { IAPProductId } from '@/types/monetization'

// Detect if we're running in Capacitor native context
function isNative(): boolean {
  return 'Capacitor' in window
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
 * Purchase a product. Returns true on success.
 * In browser/dev mode, auto-succeeds (stub).
 */
export async function purchase(productId: IAPProductId): Promise<boolean> {
  if (!isNative()) {
    console.log(`[IAPService] Stub: purchasing ${productId}`)
    return true
  }
  try {
    const { InAppPurchases } = await Function('return import("@capacitor-community/in-app-purchases")')()
    await InAppPurchases.purchase({ productId })
    return true
  } catch {
    return false
  }
}

/**
 * Restore previous purchases. Returns list of restored product IDs.
 */
export async function restorePurchases(): Promise<string[]> {
  if (!isNative()) return []
  try {
    const { InAppPurchases } = await Function('return import("@capacitor-community/in-app-purchases")')()
    const result = await InAppPurchases.restorePurchases()
    return (result as { productIds?: string[] })?.productIds ?? []
  } catch {
    return []
  }
}
