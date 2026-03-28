import type { Difficulty } from '@/types'
import { DIFFICULTY_TIERS } from '@/systems/difficultyTiers'

export interface TargetType {
  id: string
  color: string
  points: number
  speed: number
  size: number
  weight: number
  model: string
  modelScale: number
  label: string
  runAnim: string
}

export const TARGET_TYPES: TargetType[] = [
  { id: 'chicken',  color: '#F5F5DC', points: 1,  speed: 2.5, size: 0.6,  weight: 30, model: '/models/npcs/chicken.gltf',  modelScale: 1.2, label: 'Chicken',  runAnim: 'walk' },
  { id: 'pig',      color: '#FFB6C1', points: 3,  speed: 3.5, size: 0.7,  weight: 25, model: '/models/npcs/pig.gltf',      modelScale: 1.0, label: 'Pig',      runAnim: 'walk' },
  { id: 'ocelot',   color: '#F7C948', points: 5,  speed: 5,   size: 0.6,  weight: 20, model: '/models/npcs/ocelot.gltf',   modelScale: 1.0, label: 'Ocelot',   runAnim: 'run ' },
  { id: 'zombie',   color: '#2ECC71', points: 10, speed: 4.5, size: 0.8,  weight: 15, model: '/models/npcs/zombie.gltf',   modelScale: 1.0, label: 'Zombie',   runAnim: 'run' },
  { id: 'skeleton', color: '#E0E0E0', points: 20, speed: 7,   size: 0.6,  weight: 10, model: '/models/npcs/skeleton.gltf', modelScale: 1.0, label: 'Skeleton', runAnim: 'walk' },
]

export const ARCHERY_CONFIG = {
  // Range dimensions
  rangeWidth: 20,
  rangeDepth: 30,
  rangeHeight: 8,

  // Spawn
  spawnIntervalSeconds: 1.5,
  maxTargets: 6,

  // Camera
  cameraPosition: [0, 3, 8] as [number, number, number],
  cameraLookAt: [0, 3, -10] as [number, number, number],

  // Target paths — NPCs run on the ground
  targetMinY: 0,
  targetMaxY: 0,
  targetPathLength: 24,

  // Session
  roundTimeSeconds: 90,

  // Quiz
  quizEveryNShots: 10,

  // Streak
  streakBonusThreshold: 3,
  streakBonusMultiplier: 2,

  // Power meter
  minPower: 2,
  maxPower: 10,
  chargeSpeed: 4,
} as const

/** Pick a random target type using weighted distribution */
export function pickTargetType(): TargetType {
  const totalWeight = TARGET_TYPES.reduce((sum, t) => sum + t.weight, 0)
  let roll = Math.random() * totalWeight
  for (const t of TARGET_TYPES) {
    roll -= t.weight
    if (roll <= 0) return t
  }
  return TARGET_TYPES[0]
}

export function getArcheryConfig(difficulty: Difficulty) {
  const tier = DIFFICULTY_TIERS[difficulty].archery
  return {
    ...ARCHERY_CONFIG,
    roundTimeSeconds: tier.roundTimeSeconds,
    maxTargets: tier.maxTargets,
    targetSpeedScale: tier.targetSpeedScale,
    targetSizeScale: tier.targetSizeScale,
  }
}
