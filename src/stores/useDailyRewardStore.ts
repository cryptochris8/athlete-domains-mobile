import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getDailyReward } from '@/systems/dailyRewardSchedule'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { syncDailyReward } from '@/services/firestoreSync'
import { trackDailyRewardClaim } from '@/services/analyticsService'

function getTodayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isConsecutiveDay(lastDate: string | null): boolean {
  if (!lastDate) return false
  const [ly, lm, ld] = lastDate.split('-').map(Number)
  const last = new Date(ly, lm - 1, ld)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  return diff === 1
}

interface DailyRewardState {
  lastClaimDate: string | null
  currentStreak: number

  canClaim: () => boolean
  claimDailyReward: (doubled: boolean) => number
  getTodayReward: () => { day: number; coins: number; bonusCoins: number }
}

export const useDailyRewardStore = create<DailyRewardState>()(
  persist(
    (set, get) => ({
      lastClaimDate: null,
      currentStreak: 0,

      canClaim: () => {
        const { lastClaimDate } = get()
        if (!lastClaimDate) return true
        return lastClaimDate !== getTodayDateString()
      },

      getTodayReward: () => {
        const { currentStreak, lastClaimDate } = get()
        let nextStreak = 1
        if (lastClaimDate && isConsecutiveDay(lastClaimDate)) {
          nextStreak = currentStreak + 1
        }
        return getDailyReward(nextStreak)
      },

      claimDailyReward: (doubled) => {
        const { currentStreak, lastClaimDate } = get()

        let newStreak = 1
        if (lastClaimDate && isConsecutiveDay(lastClaimDate)) {
          newStreak = currentStreak + 1
        }

        const reward = getDailyReward(newStreak)
        const coins = doubled ? reward.coins + reward.bonusCoins : reward.coins

        usePlayerStore.getState().addCoins(coins)

        const today = getTodayDateString()
        set({
          lastClaimDate: today,
          currentStreak: newStreak,
        })

        // Analytics
        trackDailyRewardClaim(newStreak, coins, doubled)

        // Fire-and-forget cloud sync
        const profile = usePlayerStore.getState().getActiveProfile()
        syncDailyReward(profile?.coins ?? 0, newStreak, today).catch(() => {})

        return coins
      },
    }),
    {
      name: 'ad-ios-daily-reward',
    }
  )
)
