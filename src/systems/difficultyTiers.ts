import type { Difficulty } from '@/types'

export interface DifficultyOverrides {
  basketball: {
    totalShots: number
    roundTimeSeconds: number
    hoopRadiusScale: number
  }
  soccer: {
    totalKicks: number
    keeperSpeedScale: number
  }
  bowling: {
    totalFrames: number
    hasBumpers: boolean
    laneWidthScale: number
  }
  minigolf: {
    maxStrokes: number
    parScale: number
  }
  archery: {
    roundTimeSeconds: number
    maxTargets: number
    targetSpeedScale: number
    targetSizeScale: number
  }
  football: {
    roundTimeSeconds: number
    maxTargets: number
    targetSpeedScale: number
    targetSizeScale: number
  }
}

export const DIFFICULTY_TIERS: Record<Difficulty, DifficultyOverrides> = {
  easy: {
    basketball: { totalShots: 20, roundTimeSeconds: 120, hoopRadiusScale: 1.2 },
    soccer: { totalKicks: 7, keeperSpeedScale: 0.7 },
    bowling: { totalFrames: 6, hasBumpers: true, laneWidthScale: 1.2 },
    minigolf: { maxStrokes: 10, parScale: 1.3 },
    archery: { roundTimeSeconds: 120, maxTargets: 4, targetSpeedScale: 0.7, targetSizeScale: 1.3 },
    football: { roundTimeSeconds: 120, maxTargets: 4, targetSpeedScale: 0.7, targetSizeScale: 1.3 },
  },
  medium: {
    basketball: { totalShots: 15, roundTimeSeconds: 90, hoopRadiusScale: 1.0 },
    soccer: { totalKicks: 5, keeperSpeedScale: 1.0 },
    bowling: { totalFrames: 10, hasBumpers: false, laneWidthScale: 1.0 },
    minigolf: { maxStrokes: 8, parScale: 1.0 },
    archery: { roundTimeSeconds: 90, maxTargets: 6, targetSpeedScale: 1.0, targetSizeScale: 1.0 },
    football: { roundTimeSeconds: 90, maxTargets: 6, targetSpeedScale: 1.0, targetSizeScale: 1.0 },
  },
  hard: {
    basketball: { totalShots: 10, roundTimeSeconds: 60, hoopRadiusScale: 0.85 },
    soccer: { totalKicks: 4, keeperSpeedScale: 1.4 },
    bowling: { totalFrames: 10, hasBumpers: false, laneWidthScale: 0.85 },
    minigolf: { maxStrokes: 6, parScale: 0.8 },
    archery: { roundTimeSeconds: 60, maxTargets: 8, targetSpeedScale: 1.4, targetSizeScale: 0.8 },
    football: { roundTimeSeconds: 60, maxTargets: 8, targetSpeedScale: 1.4, targetSizeScale: 0.8 },
  },
}

export function getDifficultyOverrides(difficulty: Difficulty): DifficultyOverrides {
  return DIFFICULTY_TIERS[difficulty]
}
