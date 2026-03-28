import type { Vec3 } from '@/systems/soccerAI'

/**
 * Simple object pool for Vec3 ({x, y, z}) instances.
 * Call reset() at the start of each frame, then get() to obtain reusable objects.
 * Eliminates per-frame GC pressure from small object allocations in hot loops.
 */
export class Vec3Pool {
  private pool: Vec3[] = []
  private index = 0

  /** Reset the pool for a new frame. Previously obtained objects become invalid. */
  reset(): void {
    this.index = 0
  }

  /** Get a Vec3 from the pool, reusing an existing object or creating a new one. */
  get(x = 0, y = 0, z = 0): Vec3 {
    if (this.index < this.pool.length) {
      const v = this.pool[this.index++]
      v.x = x
      v.y = y
      v.z = z
      return v
    }
    const v = { x, y, z }
    this.pool.push(v)
    this.index++
    return v
  }

  /** Number of objects checked out this frame. */
  get used(): number {
    return this.index
  }

  /** Total pool capacity (objects allocated so far). */
  get capacity(): number {
    return this.pool.length
  }
}
