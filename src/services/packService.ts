import type { PackDefinition, Rarity } from '@/types/monetization'
import { RARITY_CONFIG } from '@/types/monetization'
import { getAvatarRarity } from '@/systems/avatarRarity'

const TOTAL_AVATARS = 3000

export interface PackOpenResult {
  avatarIds: number[]
  duplicateIds: number[]
  coinsFromDuplicates: number
}

/**
 * Roll a weighted random rarity based on drop weights.
 */
function rollRarity(): Rarity {
  const total = Object.values(RARITY_CONFIG).reduce((sum, r) => sum + r.dropWeight, 0)
  let roll = Math.random() * total
  for (const [rarity, config] of Object.entries(RARITY_CONFIG) as [Rarity, typeof RARITY_CONFIG[Rarity]][]) {
    roll -= config.dropWeight
    if (roll <= 0) return rarity
  }
  return 'common'
}

/**
 * Pick a random avatar ID of the given rarity.
 */
function pickAvatarOfRarity(rarity: Rarity, exclude: Set<number>): number {
  const candidates: number[] = []
  for (let id = 1; id <= TOTAL_AVATARS; id++) {
    if (getAvatarRarity(id) === rarity && !exclude.has(id)) {
      candidates.push(id)
    }
  }
  // If all of that rarity are excluded (unlikely), allow duplicates
  if (candidates.length === 0) {
    for (let id = 1; id <= TOTAL_AVATARS; id++) {
      if (getAvatarRarity(id) === rarity) candidates.push(id)
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * Roll avatar IDs for a pack. Pure function.
 * Rewards are determined immediately before any animation.
 */
export function rollPack(
  packDef: PackDefinition,
  ownedAvatarIds: number[],
): PackOpenResult {
  const ownedSet = new Set(ownedAvatarIds)
  const rolledIds: number[] = []
  const sessionExclude = new Set<number>()

  for (let i = 0; i < packDef.avatarCount; i++) {
    let rarity: Rarity

    // Last slot guarantees minimum rarity if specified
    if (i === packDef.avatarCount - 1 && packDef.guaranteedMinRarity) {
      const minRarities: Rarity[] = ['common', 'rare', 'epic', 'legendary']
      const minIdx = minRarities.indexOf(packDef.guaranteedMinRarity)
      do {
        rarity = rollRarity()
      } while (minRarities.indexOf(rarity) < minIdx)
    } else {
      rarity = rollRarity()
    }

    const avatarId = pickAvatarOfRarity(rarity, sessionExclude)
    rolledIds.push(avatarId)
    sessionExclude.add(avatarId)
  }

  const duplicateIds = rolledIds.filter((id) => ownedSet.has(id))
  const coinsFromDuplicates = calculateDuplicateCoins(duplicateIds)

  return {
    avatarIds: rolledIds,
    duplicateIds,
    coinsFromDuplicates,
  }
}

/**
 * Calculate coins earned from duplicate avatars.
 */
export function calculateDuplicateCoins(duplicateIds: number[]): number {
  return duplicateIds.reduce((total, id) => {
    const rarity = getAvatarRarity(id)
    return total + RARITY_CONFIG[rarity].coinValue
  }, 0)
}
