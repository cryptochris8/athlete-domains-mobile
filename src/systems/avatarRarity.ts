import type { Rarity } from '@/types/monetization'

const SEED = 73939133 // large prime for stable hashing

function seededHash(id: number): number {
  let h = (id * SEED) >>> 0
  h = ((h >> 16) ^ h) * 0x45d9f3b >>> 0
  h = ((h >> 16) ^ h) >>> 0
  return h % 100 // 0-99
}

export function getAvatarRarity(avatarId: number): Rarity {
  const roll = seededHash(avatarId)
  if (roll < 70) return 'common'      // 0-69: 70%
  if (roll < 95) return 'rare'        // 70-94: 25%
  if (roll < 99) return 'epic'        // 95-98: 4%
  return 'legendary'                   // 99: 1%
}

export function getAvatarIdsByRarity(rarity: Rarity): number[] {
  const ids: number[] = []
  for (let i = 1; i <= 3000; i++) {
    if (getAvatarRarity(i) === rarity) ids.push(i)
  }
  return ids
}

export const STARTER_AVATAR_IDS: number[] = [1, 100, 250, 500, 750]
