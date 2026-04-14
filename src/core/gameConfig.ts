/**
 * Centralized game configuration.
 * Single source of truth for economy, packs, IAP, founder, and NFT bridge settings.
 */

export const GAME_CONFIG = {
  starterAvatars: [1, 100, 250, 500, 750],
  starterCosmetics: {
    shirts: ['shirt-red'],
    shoes: ['shoes-white'],
  },
  economy: {
    matchCoins: { 0: 10, 1: 30, 2: 50, 3: 75 } as Record<number, number>,
    winBonusCoins: 30,
    highScoreBonusCoins: 25,
    dailyRewardBase: 25,
    duplicateConversionCoins: {
      common: 50,
      rare: 125,
      epic: 300,
      legendary: 750,
    } as Record<string, number>,
  },
  packs: {
    basic:     { enabled: true,  priceCoins: 500,  itemCount: 1, guaranteedRarity: null },
    pro:       { enabled: true,  priceCoins: 1500, itemCount: 3, guaranteedRarity: 'rare' },
    elite:     { enabled: true,  priceCoins: 3500, itemCount: 5, guaranteedRarity: 'epic' },
    legendary: { enabled: true,  priceCoins: 6000, itemCount: 3, guaranteedRarity: 'legendary' },
  },
  iapProducts: {
    removeAds: 'remove_ads',
    coinPackSmall: 'coins_1000',
    coinPackMedium: 'coins_4000',
    coinPackLarge: 'coins_8000',
    starterOffer: 'starter_pack',
  },
  founder: {
    enabled: true,
    badgeLabel: 'OG Founder',
    cosmeticOnly: true,
  },
  nftBridge: {
    enabled: true,
    inAppUnlockingAllowed: false,
    directCoinGrantAllowed: false,
  },
} as const
