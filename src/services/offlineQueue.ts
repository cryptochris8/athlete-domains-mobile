/**
 * Simple offline queue for Firestore sync operations.
 * Stores failed sync calls in localStorage and replays them when back online.
 */

const QUEUE_KEY = 'ad-ios-offline-queue'

interface QueuedOperation {
  id: number
  fn: string // function name from firestoreSync
  args: unknown[]
  createdAt: number
}

let nextId = 0

function getQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedOperation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

/** Add a failed operation to the offline queue */
export function enqueue(fn: string, args: unknown[]) {
  const queue = getQueue()
  queue.push({ id: nextId++, fn, args, createdAt: Date.now() })
  // Keep queue bounded (max 100 operations)
  if (queue.length > 100) queue.splice(0, queue.length - 100)
  saveQueue(queue)
}

/** Replay all queued operations. Call when coming back online. */
export async function flushQueue(
  syncFns: Record<string, (...args: unknown[]) => Promise<void>>
): Promise<number> {
  const queue = getQueue()
  if (queue.length === 0) return 0

  let flushed = 0
  const remaining: QueuedOperation[] = []

  for (const op of queue) {
    const fn = syncFns[op.fn]
    if (!fn) continue
    try {
      await fn(...op.args)
      flushed++
    } catch {
      // Still offline or transient error — keep in queue
      remaining.push(op)
    }
  }

  saveQueue(remaining)
  return flushed
}

/** Get the number of pending operations */
export function queueSize(): number {
  return getQueue().length
}
