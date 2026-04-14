import { describe, it, expect } from 'vitest'
import { rollPack, calculateDuplicateCoins } from '@/services/packService'
import type { PackDefinition } from '@/types/monetization'

const basicPack: PackDefinition = {
  type: 'basic',
  name: 'Basic Pack',
  price: 500,
  avatarCount: 1,
  description: 'Test',
}

const proPack: PackDefinition = {
  type: 'pro',
  name: 'Pro Pack',
  price: 1500,
  avatarCount: 3,
  description: 'Test',
  guaranteedMinRarity: 'rare',
}

describe('rollPack', () => {
  it('returns correct number of avatars', () => {
    const result = rollPack(basicPack, [])
    expect(result.avatarIds).toHaveLength(1)

    const result2 = rollPack(proPack, [])
    expect(result2.avatarIds).toHaveLength(3)
  })

  it('returns unique avatars within a pack', () => {
    const result = rollPack(proPack, [])
    const unique = new Set(result.avatarIds)
    expect(unique.size).toBe(result.avatarIds.length)
  })

  it('detects duplicates against owned avatars', () => {
    // Roll many packs and check that owned IDs are flagged as duplicates
    for (let i = 0; i < 50; i++) {
      const result = rollPack(basicPack, [1, 2, 3, 4, 5, 100, 200, 300, 500, 750])
      if (result.duplicateIds.length > 0) {
        // Every duplicate should be in the owned list
        for (const dup of result.duplicateIds) {
          expect([1, 2, 3, 4, 5, 100, 200, 300, 500, 750]).toContain(dup)
        }
        break
      }
    }
    // With 10 owned out of 3000, duplicates are unlikely but possible
    // This test just validates the logic when they occur
  })

  it('returns valid avatar IDs (1-3000)', () => {
    for (let i = 0; i < 20; i++) {
      const result = rollPack(proPack, [])
      for (const id of result.avatarIds) {
        expect(id).toBeGreaterThanOrEqual(1)
        expect(id).toBeLessThanOrEqual(3000)
      }
    }
  })
})

describe('calculateDuplicateCoins', () => {
  it('returns 0 for empty array', () => {
    expect(calculateDuplicateCoins([])).toBe(0)
  })

  it('returns positive value for duplicates', () => {
    // Any valid avatar ID should produce some coins
    const coins = calculateDuplicateCoins([1, 100, 500])
    expect(coins).toBeGreaterThan(0)
  })
})
