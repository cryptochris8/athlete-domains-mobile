import type { Difficulty } from '@/types'
import { DIFFICULTY_TIERS } from '@/systems/difficultyTiers'

export const BOWLING_CONFIG = {
  // Lane
  laneLength: 18,
  laneWidth: 1.06,
  gutterWidth: 0.24,

  // Ball
  ballRadius: 0.109,
  ballMass: 6.0,
  ballRestitution: 0.3,
  ballStartPosition: [0, 0.15, 7] as [number, number, number],
  maxBallSpeed: 12,
  minBallSpeed: 4,

  // Pins — tuned for realistic pin carry and chain reactions
  pinHeight: 0.38,
  pinRadius: 0.06,
  pinMass: 0.4,           // Lighter pins = more knockdown energy transfer (real: ~1.5kg for 6kg ball)
  pinRestitution: 0.45,   // Lower bounce, more energy absorbed into knockdown motion
  pinSpacing: 0.30,
  pinStartZ: -7,

  // Scoring
  strikePoints: 15,
  sparePoints: 10,
  pinPoint: 1,

  // Session
  totalFrames: 10,

  // Camera
  behindPosition: [0, 2, 10] as [number, number, number],
  followDistance: 3,
  pinCamPosition: [2, 0.5, -6] as [number, number, number],
} as const

export function getBowlingConfig(difficulty: Difficulty) {
  const tier = DIFFICULTY_TIERS[difficulty].bowling
  return {
    ...BOWLING_CONFIG,
    totalFrames: tier.totalFrames,
    hasBumpers: tier.hasBumpers,
    laneWidthScale: tier.laneWidthScale,
  }
}

// Pin positions in standard triangle formation
export function getPinPositions(): [number, number, number][] {
  const positions: [number, number, number][] = []
  const { pinSpacing, pinStartZ, pinHeight } = BOWLING_CONFIG
  const rows = [1, 2, 3, 4]
  let rowZ = pinStartZ

  for (const count of rows) {
    const startX = -(count - 1) * pinSpacing / 2
    for (let i = 0; i < count; i++) {
      positions.push([startX + i * pinSpacing, pinHeight / 2 + 0.01, rowZ])
    }
    rowZ -= pinSpacing * 0.866 // equilateral triangle spacing
  }

  return positions
}
