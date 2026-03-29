import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getDailyReward } from '@/systems/dailyRewardSchedule'
import { usePlayerStore } from '@/stores/usePlayerStore'

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

function isConsecutiveDay(lastDate: string | null): boolean {
  if (!lastDate) return false
  const last = new Date(lastDate)
  const today = new Date(getTodayDateString())
  const diff = (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
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

        set({
          lastClaimDate: getTodayDateString(),
          currentStreak: newStreak,
        })

        return coins
      },
    }),
    {
      name: 'ad-ios-daily-reward',
    }
  )
)
