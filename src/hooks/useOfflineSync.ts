import { useEffect } from 'react'
import { flushQueue } from '@/services/offlineQueue'
import {
  syncCoins,
  syncAfterPackOpen,
  syncAfterMatch,
  syncEquipped,
  syncDailyReward,
  syncAfterPurchase,
  syncPlayerData,
} from '@/services/firestoreSync'

// Map of sync function names to their implementations
const syncFns: Record<string, (...args: unknown[]) => Promise<void>> = {
  syncCoins: (coins: unknown) => syncCoins(coins as number),
  syncAfterPackOpen: (coins: unknown, ids: unknown) =>
    syncAfterPackOpen(coins as number, ids as number[]),
  syncAfterMatch: (data: unknown) =>
    syncAfterMatch(data as Parameters<typeof syncAfterMatch>[0]),
  syncEquipped: (shirt: unknown, shoes: unknown) =>
    syncEquipped(shirt as string | null, shoes as string | null),
  syncDailyReward: (coins: unknown, streak: unknown, date: unknown) =>
    syncDailyReward(coins as number, streak as number, date as string),
  syncAfterPurchase: (data: unknown) =>
    syncAfterPurchase(data as Parameters<typeof syncAfterPurchase>[0]),
  syncPlayerData: (data: unknown) =>
    syncPlayerData(data as Parameters<typeof syncPlayerData>[0]),
}

/**
 * Listens for the browser coming back online and flushes
 * any queued Firestore sync operations.
 */
export function useOfflineSync() {
  useEffect(() => {
    const handleOnline = async () => {
      const flushed = await flushQueue(syncFns)
      if (flushed > 0) {
        console.log(`[OfflineSync] Flushed ${flushed} queued operations`)
      }
    }

    window.addEventListener('online', handleOnline)

    // Also try flushing on mount in case we're already online with a stale queue
    if (navigator.onLine) {
      handleOnline()
    }

    return () => window.removeEventListener('online', handleOnline)
  }, [])
}
