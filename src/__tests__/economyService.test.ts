import { describe, it, expect } from 'vitest'
import { calculateMatchCoins, canAfford } from '@/services/economyService'

describe('calculateMatchCoins', () => {
  it('awards base coins from stars', () => {
    expect(calculateMatchCoins({ stars: 0, isNewHighScore: false })).toBe(10)
    expect(calculateMatchCoins({ stars: 1, isNewHighScore: false })).toBe(30)
    expect(calculateMatchCoins({ stars: 2, isNewHighScore: false })).toBe(50)
    expect(calculateMatchCoins({ stars: 3, isNewHighScore: false })).toBe(75)
  })

  it('adds win bonus', () => {
    expect(calculateMatchCoins({ stars: 1, isNewHighScore: false, isWin: true })).toBe(60)
  })

  it('adds high score bonus', () => {
    expect(calculateMatchCoins({ stars: 1, isNewHighScore: true })).toBe(55)
  })

  it('stacks all bonuses', () => {
    expect(calculateMatchCoins({ stars: 3, isNewHighScore: true, isWin: true })).toBe(130)
  })
})

describe('canAfford', () => {
  it('returns true when balance >= price', () => {
    expect(canAfford(500, 500)).toBe(true)
    expect(canAfford(1000, 500)).toBe(true)
  })

  it('returns false when balance < price', () => {
    expect(canAfford(499, 500)).toBe(false)
    expect(canAfford(0, 1)).toBe(false)
  })
})
