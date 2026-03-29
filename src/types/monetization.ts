export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export const RARITY_CONFIG: Record<Rarity, {
  label: string
  color: string
  coinValue: number
  dropWeight: number
  statMultiplier: number
}> = {
  common:    { label: 'Common',    color: '#A0A0A0', coinValue: 2,  dropWeight: 70, statMultiplier: 1.0  },
  rare:      { label: 'Rare',      color: '#3498DB', coinValue: 5,  dropWeight: 25, statMultiplier: 1.1  },
  epic:      { label: 'Epic',      color: '#9B59B6', coinValue: 15, dropWeight: 4,  statMultiplier: 1.25 },
  legendary: { label: 'Legendary', color: '#FFD700', coinValue: 40, dropWeight: 1,  statMultiplier: 1.5  },
}

export interface AvatarCatalogEntry {
  id: number
  sport: string
  name: string
  rarity: Rarity
}

export type CosmeticSlot = 'shirt' | 'shoes'

export interface CosmeticItem {
  id: string
  name: string
  slot: CosmeticSlot
  price: number
  rarity: Rarity
  color: string
  description: string
}

export type PackType = 'basic' | 'pro' | 'elite' | 'legendary'

export interface PackDefinition {
  type: PackType
  name: string
  price: number
  avatarCount: number
  description: string
  guaranteedMinRarity?: Rarity
}

export interface DailyRewardTier {
  day: number
  coins: number
  bonusCoins: number
}

export type IAPProductId =
  | 'remove_ads'
  | 'coins_1000'
  | 'coins_4000'
  | 'coins_8000'
  | 'starter_pack'
  | 'elite_pack'
  | 'legendary_pack'

export interface IAPProduct {
  productId: IAPProductId
  name: string
  description: string
  coins?: number
  includesAvatars?: number[]
  removesAds?: boolean
}

export type AdPlacement =
  | 'double_coins'
  | 'free_pack'
  | 'boost_daily'
  | 'retry_after_loss'
