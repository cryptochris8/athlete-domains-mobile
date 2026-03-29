// Type stubs for Capacitor plugins — installed on iOS build only
declare module '@capacitor-community/admob' {
  export const AdMob: {
    initialize(options: { initializeForTesting?: boolean }): Promise<void>
    prepareRewardVideoAd(options: { adId: string; isTesting?: boolean }): Promise<void>
    showRewardVideoAd(): Promise<unknown>
  }
}

declare module '@capacitor-community/in-app-purchases' {
  export const InAppPurchases: {
    initialize(): Promise<void>
    getProducts(options: { productIds: string[] }): Promise<unknown>
    purchase(options: { productId: string }): Promise<unknown>
    restorePurchases(): Promise<unknown>
  }
}
