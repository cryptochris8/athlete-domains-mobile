import type { DailyRewardTier } from '@/types/monetization'

export const DAILY_REWARDS: DailyRewardTier[] = [
  { day: 1, coins: 25, bonusCoins: 25 },
  { day: 2, coins: 25, bonusCoins: 25 },
  { day: 3, coins: 35, bonusCoins: 35 },
  { day: 4, coins: 35, bonusCoins: 35 },
  { day: 5, coins: 50, bonusCoins: 50 },
  { day: 6, coins: 60, bonusCoins: 60 },
  { day: 7, coins: 75, bonusCoins: 75 },
]

export function getDailyReward(streakDay: number): DailyRewardTier {
  const day = ((streakDay - 1) % 7) + 1
  return DAILY_REWARDS[day - 1]
}
