import { describe, it, expect } from 'vitest'
import { getGameCoins, getScoreLabel } from '@/utils/scoring'

describe('getGameCoins', () => {
  it('returns coins based on stars', () => {
    expect(getGameCoins(0, false)).toBe(10)
    expect(getGameCoins(1, false)).toBe(30)
    expect(getGameCoins(2, false)).toBe(50)
    expect(getGameCoins(3, false)).toBe(75)
  })

  it('adds bonus for new high score', () => {
    expect(getGameCoins(1, true)).toBe(55)
    expect(getGameCoins(3, true)).toBe(100)
  })
})

describe('getScoreLabel', () => {
  it('returns appropriate labels', () => {
    expect(getScoreLabel('basketball', 3)).toBe('Amazing!')
    expect(getScoreLabel('basketball', 2)).toBe('Great job!')
    expect(getScoreLabel('basketball', 1)).toBe('Good try!')
    expect(getScoreLabel('basketball', 0)).toBe('Keep practicing!')
  })
})
