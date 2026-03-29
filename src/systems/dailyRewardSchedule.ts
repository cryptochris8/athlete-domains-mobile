import type { DailyRewardTier } from '@/types/monetization'

export const DAILY_REWARDS: DailyRewardTier[] = [
  { day: 1, coins: 5,  bonusCoins: 5  },
  { day: 2, coins: 5,  bonusCoins: 5  },
  { day: 3, coins: 10, bonusCoins: 10 },
  { day: 4, coins: 10, bonusCoins: 10 },
  { day: 5, coins: 15, bonusCoins: 15 },
  { day: 6, coins: 20, bonusCoins: 20 },
  { day: 7, coins: 30, bonusCoins: 30 },
]

export function getDailyReward(streakDay: number): DailyRewardTier {
  const day = ((streakDay - 1) % 7) + 1
  return DAILY_REWARDS[day - 1]
}
