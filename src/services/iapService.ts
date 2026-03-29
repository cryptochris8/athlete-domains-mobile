import type { IAPProductId } from '@/types/monetization'

let iapPlugin: typeof import('@capacitor-community/in-app-purchases') | null = null

async function getIAP() {
  if (iapPlugin) return iapPlugin
  try {
    iapPlugin = await import('@capacitor-community/in-app-purchases')
    return iapPlugin
  } catch {
    return null
  }
}

/**
 * Initialize IAP. Call once at app startup.
 */
export async function initializeIAP(): Promise<void> {
  const iap = await getIAP()
  if (!iap) {
    console.log('[IAPService] No native IAP plugin available (browser mode)')
    return
  }
  try {
    await iap.InAppPurchases.initialize()
  } catch (e) {
    console.warn('[IAPService] Init failed:', e)
  }
}

/**
 * Load product details from the App Store.
 */
export async function loadProducts(productIds: IAPProductId[]): Promise<void> {
  const iap = await getIAP()
  if (!iap) return
  try {
    await iap.InAppPurchases.getProducts({ productIds })
  } catch (e) {
    console.warn('[IAPService] Load products failed:', e)
  }
}

/**
 * Purchase a product. Returns true on success.
 */
export async function purchase(productId: IAPProductId): Promise<boolean> {
  const iap = await getIAP()
  if (!iap) {
    // Stub: auto-purchase in dev/browser
    console.log(`[IAPService] Stub: purchasing ${productId}`)
    return true
  }
  try {
    await iap.InAppPurchases.purchase({ productId })
    return true
  } catch {
    return false
  }
}

/**
 * Restore previous purchases. Returns list of restored product IDs.
 */
export async function restorePurchases(): Promise<string[]> {
  const iap = await getIAP()
  if (!iap) return []
  try {
    const result = await iap.InAppPurchases.restorePurchases()
    return (result as { productIds?: string[] })?.productIds ?? []
  } catch {
    return []
  }
}
