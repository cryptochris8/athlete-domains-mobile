import type { IAPProduct } from '@/types/monetization'

export const IAP_PRODUCTS: IAPProduct[] = [
  {
    productId: 'remove_ads',
    name: 'Remove Ads',
    description: 'Remove all ads permanently',
    removesAds: true,
  },
  {
    productId: 'coins_1000',
    name: '1,000 Coins',
    description: 'A pouch of coins',
    coins: 1000,
  },
  {
    productId: 'coins_4000',
    name: '4,000 Coins',
    description: 'A bag of coins',
    coins: 4000,
  },
  {
    productId: 'coins_8000',
    name: '8,000 Coins',
    description: 'A chest of coins',
    coins: 8000,
  },
  {
    productId: 'starter_pack',
    name: 'Starter Pack',
    description: '10 avatars with 2 Rare+ guaranteed',
    coins: 0,
    includesAvatars: [42, 87, 156, 234, 378, 512, 645, 789, 891, 1234],
  },
  {
    productId: 'elite_pack',
    name: 'Elite Pack',
    description: '5 avatars with 1 Epic+ guaranteed',
    coins: 0,
  },
  {
    productId: 'legendary_pack',
    name: 'Legendary Pack',
    description: '1 Legendary + 2 additional avatars',
    coins: 0,
  },
]

export function getIAPProduct(productId: string): IAPProduct | undefined {
  return IAP_PRODUCTS.find((p) => p.productId === productId)
}
