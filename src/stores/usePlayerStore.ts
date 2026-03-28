import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlayerProfile } from '@/types'
import { LEGACY_SKIN_MAP } from '@/core/constants'

const DEFAULT_PROFILES: PlayerProfile[] = [
  { id: 1, name: 'Player 1', age: 6, avatar: '🌟', skinId: 1, coins: 0, totalXP: 0, createdAt: 0 },
  { id: 2, name: 'Player 2', age: 8, avatar: '⭐', skinId: 1, coins: 0, totalXP: 0, createdAt: 0 },
  { id: 3, name: 'Player 3', age: 8, avatar: '💫', skinId: 1, coins: 0, totalXP: 0, createdAt: 0 },
]

interface PlayerState {
  profiles: PlayerProfile[]
  activeProfileId: number | null
  getActiveProfile: () => PlayerProfile | null
  setActiveProfile: (id: number) => void
  updateProfile: (id: number, updates: Partial<PlayerProfile>) => void
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  addXP: (amount: number) => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      profiles: DEFAULT_PROFILES,
      activeProfileId: null,

      getActiveProfile: () => {
        const { profiles, activeProfileId } = get()
        return profiles.find((p) => p.id === activeProfileId) ?? null
      },

      setActiveProfile: (id) => set({ activeProfileId: id }),

      updateProfile: (id, updates) =>
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      addCoins: (amount) => {
        const { activeProfileId } = get()
        if (!activeProfileId) return
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === activeProfileId ? { ...p, coins: p.coins + amount } : p
          ),
        }))
      },

      spendCoins: (amount) => {
        const { activeProfileId, profiles } = get()
        if (!activeProfileId) return false
        const profile = profiles.find((p) => p.id === activeProfileId)
        if (!profile || profile.coins < amount) return false
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === activeProfileId ? { ...p, coins: p.coins - amount } : p
          ),
        }))
        return true
      },

      addXP: (amount) => {
        const { activeProfileId } = get()
        if (!activeProfileId) return
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === activeProfileId ? { ...p, totalXP: p.totalXP + amount } : p
          ),
        }))
      },
    }),
    {
      name: 'three-j-players',
      partialize: (state) => ({
        profiles: state.profiles.map(({ _skinMigrated: _, ...rest }) => rest),
        activeProfileId: state.activeProfileId,
      }),
      merge: (persisted, current) => {
        const state = { ...current, ...(persisted as Partial<PlayerState>) }
        if (state.profiles) {
          state.profiles = state.profiles.map((p) => {
            const legacy = p as PlayerProfile & { gender?: string }
            // Migrate old `gender` field to skinId
            if (legacy.skinId == null) {
              const skinId = legacy.gender === 'female' ? 2 : 1
              const { gender: _, ...rest } = legacy
              return { ...rest, skinId } as PlayerProfile
            }
            // Migrate old skinId (1-10) to edition numbers
            // Only migrate if skinId is a legacy picker index (1-10) AND not already an edition number
            if (legacy.skinId >= 1 && legacy.skinId <= 10 && !legacy._skinMigrated) {
              return { ...p, skinId: LEGACY_SKIN_MAP[legacy.skinId] ?? 1, _skinMigrated: true } as PlayerProfile
            }
            return p
          })
        }
        return state
      },
    }
  )
)
