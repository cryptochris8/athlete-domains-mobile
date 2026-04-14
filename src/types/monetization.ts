export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export const RARITY_CONFIG: Record<Rarity, {
  label: string
  color: string
  coinValue: number
  dropWeight: number
}> = {
  common:    { label: 'Common',    color: '#A0A0A0', coinValue: 50,  dropWeight: 70 },
  rare:      { label: 'Rare',      color: '#3498DB', coinValue: 125, dropWeight: 25 },
  epic:      { label: 'Epic',      color: '#9B59B6', coinValue: 300, dropWeight: 4  },
  legendary: { label: 'Legendary', color: '#FFD700', coinValue: 750, dropWeight: 1  },
}

export interface AvatarCatalogEntry {
  id: number
  sport: string
  name: string
  rarity?: Rarity
  isStarter: boolean
  founderCollection: boolean
  collectionTag: string | null
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
