import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { audioManager } from '@/core/AudioManager'
import { getItemById, type ShopItemCategory } from '@/systems/shopCatalog'

interface ShopState {
  ownedItems: string[]
  equippedBall: string | null
  equippedCelebration: string | null
  equippedTheme: string | null
  equippedAccessory: string | null
  owns: (itemId: string) => boolean
  buyItem: (itemId: string) => void
  equipItem: (itemId: string, category: ShopItemCategory) => void
  getEquippedBallColor: () => string | null
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      ownedItems: [],
      equippedBall: null,
      equippedCelebration: null,
      equippedTheme: null,
      equippedAccessory: null,

      owns: (itemId) => get().ownedItems.includes(itemId),

      buyItem: (itemId) => {
        set((s) =>
          s.ownedItems.includes(itemId)
            ? s
            : { ownedItems: [...s.ownedItems, itemId] }
        )
        audioManager.play('unlock')
      },

      equipItem: (itemId, category) => {
        audioManager.play('grab')
        switch (category) {
          case 'ball':
            set({ equippedBall: get().equippedBall === itemId ? null : itemId })
            break
          case 'celebration':
            set({ equippedCelebration: get().equippedCelebration === itemId ? null : itemId })
            break
          case 'theme':
            set({ equippedTheme: get().equippedTheme === itemId ? null : itemId })
            break
          case 'accessory':
            set({ equippedAccessory: get().equippedAccessory === itemId ? null : itemId })
            break
        }
      },

      getEquippedBallColor: () => {
        const { equippedBall } = get()
        if (!equippedBall) return null
        const item = getItemById(equippedBall)
        return item?.color ?? null
      },
    }),
    { name: 'three-j-shop' }
  )
)
