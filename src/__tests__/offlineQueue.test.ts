// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { enqueue, flushQueue, queueSize } from '@/services/offlineQueue'

beforeEach(() => {
  localStorage.removeItem('ad-ios-offline-queue')
})

describe('offlineQueue', () => {
  it('starts empty', () => {
    expect(queueSize()).toBe(0)
  })

  it('enqueues operations', () => {
    enqueue('syncCoins', [100])
    expect(queueSize()).toBe(1)
    enqueue('syncCoins', [200])
    expect(queueSize()).toBe(2)
  })

  it('flushes successfully', async () => {
    enqueue('syncCoins', [100])
    enqueue('syncCoins', [200])

    const calls: unknown[][] = []
    const flushed = await flushQueue({
      syncCoins: async (...args: unknown[]) => { calls.push(args) },
    })

    expect(flushed).toBe(2)
    expect(queueSize()).toBe(0)
    expect(calls).toHaveLength(2)
  })

  it('keeps failed operations in queue', async () => {
    enqueue('syncCoins', [100])

    const flushed = await flushQueue({
      syncCoins: async () => { throw new Error('offline') },
    })

    expect(flushed).toBe(0)
    expect(queueSize()).toBe(1)
  })

  it('caps queue at 100 items', () => {
    for (let i = 0; i < 120; i++) {
      enqueue('syncCoins', [i])
    }
    expect(queueSize()).toBe(100)
  })
})
