import { create } from 'zustand'
import type { PackType } from '@/types/monetization'
import { getPackByType } from '@/systems/packCatalog'
import { rollPack } from '@/services/packService'
import { usePlayerStore } from '@/stores/usePlayerStore'

interface InventoryState {
  isPackOpening: boolean
  pendingRewards: number[]
  revealedCount: number
  duplicateIds: number[]
  coinsFromDuplicates: number
  lastPackType: PackType | null

  openPack: (packType: PackType) => { success: boolean; error?: string }
  revealNext: () => number | null
  finishPackOpen: () => void
  resetPackState: () => void
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  isPackOpening: false,
  pendingRewards: [],
  revealedCount: 0,
  duplicateIds: [],
  coinsFromDuplicates: 0,
  lastPackType: null,

  openPack: (packType) => {
    const packDef = getPackByType(packType)
    if (!packDef) return { success: false, error: 'Invalid pack type' }

    const playerStore = usePlayerStore.getState()
    const profile = playerStore.getActiveProfile()
    if (!profile) return { success: false, error: 'No active profile' }

    if (profile.coins < packDef.price) {
      return { success: false, error: 'Not enough coins' }
    }

    // Spend coins
    playerStore.spendCoins(packDef.price)

    // Roll rewards (determined BEFORE animation)
    const ownedIds = profile.ownedAvatarIds ?? []
    const result = rollPack(packDef, ownedIds)

    // Add new avatars to inventory (non-duplicates)
    const newIds = result.avatarIds.filter((id) => !result.duplicateIds.includes(id) || !ownedIds.includes(id))
    for (const id of newIds) {
      if (!ownedIds.includes(id)) {
        playerStore.ownAvatar(id)
      }
    }

    // Award duplicate coins
    if (result.coinsFromDuplicates > 0) {
      playerStore.addCoins(result.coinsFromDuplicates)
    }

    set({
      isPackOpening: true,
      pendingRewards: result.avatarIds,
      revealedCount: 0,
      duplicateIds: result.duplicateIds,
      coinsFromDuplicates: result.coinsFromDuplicates,
      lastPackType: packType,
    })

    return { success: true }
  },

  revealNext: () => {
    const { pendingRewards, revealedCount } = get()
    if (revealedCount >= pendingRewards.length) return null
    set({ revealedCount: revealedCount + 1 })
    return pendingRewards[revealedCount]
  },

  finishPackOpen: () => {
    set({
      isPackOpening: false,
      revealedCount: get().pendingRewards.length,
    })
  },

  resetPackState: () => {
    set({
      isPackOpening: false,
      pendingRewards: [],
      revealedCount: 0,
      duplicateIds: [],
      coinsFromDuplicates: 0,
      lastPackType: null,
    })
  },
}))
