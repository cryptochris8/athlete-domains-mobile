import { describe, it, expect } from 'vitest'
import { getDailyReward, DAILY_REWARDS } from '@/systems/dailyRewardSchedule'

describe('dailyRewardSchedule', () => {
  it('has 7 days defined', () => {
    expect(DAILY_REWARDS).toHaveLength(7)
  })

  it('rewards increase over the week', () => {
    const coins = DAILY_REWARDS.map((r) => r.coins)
    for (let i = 1; i < coins.length; i++) {
      expect(coins[i]).toBeGreaterThanOrEqual(coins[i - 1])
    }
  })

  it('getDailyReward wraps streak to 7-day cycle', () => {
    const day1 = getDailyReward(1)
    const day8 = getDailyReward(8)
    expect(day8.day).toBe(day1.day) // wraps back to day 1
  })

  it('returns coins and bonusCoins', () => {
    const reward = getDailyReward(1)
    expect(reward.coins).toBeGreaterThan(0)
    expect(typeof reward.bonusCoins).toBe('number')
  })
})
