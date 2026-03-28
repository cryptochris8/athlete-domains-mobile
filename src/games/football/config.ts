import type { Difficulty } from '@/types'
import { DIFFICULTY_TIERS } from '@/systems/difficultyTiers'

export interface FootballTargetType {
  id: string
  color: string
  points: number
  speed: number
  size: number
  weight: number
  label: string
  /** If set, renders an AnimalTarget GLTF model */
  model?: string
  modelScale?: number
  runAnim?: string
  /** If set, renders a HytopiaAvatar with this skin URL */
  skinUrl?: string
}

// Mix of archery animals (familiar, lower value) and football avatar defenders (higher value)
export const FOOTBALL_TARGET_TYPES: FootballTargetType[] = [
  // Animals — reuse archery NPC models
  { id: 'chicken',    color: '#F5F5DC', points: 1,  speed: 2.5, size: 0.6, weight: 30, label: 'Chicken',    model: '/models/npcs/chicken.gltf',  modelScale: 1.2, runAnim: 'walk' },
  { id: 'pig',        color: '#FFB6C1', points: 3,  speed: 3.0, size: 0.7, weight: 25, label: 'Pig',        model: '/models/npcs/pig.gltf',      modelScale: 1.0, runAnim: 'walk' },
  { id: 'ocelot',     color: '#F7C948', points: 5,  speed: 4.5, size: 0.6, weight: 20, label: 'Ocelot',     model: '/models/npcs/ocelot.gltf',   modelScale: 1.0, runAnim: 'run ' },
  // Football avatar defenders — higher value, use HytopiaAvatar with football skins
  { id: 'defender-1', color: '#E74C3C', points: 8,  speed: 3.5, size: 0.9, weight: 12, label: 'Defender',   skinUrl: '/skins/football/defender_1.png', modelScale: 1.8 },
  { id: 'defender-2', color: '#3498DB', points: 8,  speed: 4.0, size: 0.9, weight: 12, label: 'Defender',   skinUrl: '/skins/football/defender_2.png', modelScale: 1.8 },
  { id: 'defender-3', color: '#9B59B6', points: 15, speed: 5.5, size: 0.8, weight: 8,  label: 'Star Def.',  skinUrl: '/skins/football/defender_5.png', modelScale: 1.6 },
  { id: 'defender-4', color: '#E67E22', points: 25, speed: 7.0, size: 0.7, weight: 5,  label: 'MVP',        skinUrl: '/skins/football/defender_10.png', modelScale: 1.4 },
]

export interface DefenderLane {
  z: number
  speed: number
  direction: 1 | -1
  skinUrl: string
}

export const DEFENDER_SKINS = [
  '/skins/football/defender_3.png',
  '/skins/football/defender_4.png',
  '/skins/football/defender_6.png',
  '/skins/football/defender_7.png',
]

export const DEFENDER_CONFIG = {
  scale: 1.8,
  collisionRadius: 1.0,
  patrolWidth: 12,
  celebrateDuration: 1.5,
} as const

export const FOOTBALL_CONFIG = {
  // Field dimensions
  fieldWidth: 30,
  fieldDepth: 40,

  // Spawn
  spawnIntervalSeconds: 1.5,
  maxTargets: 6,

  // Camera (behind QB looking downfield)
  cameraPosition: [0, 3, 8] as [number, number, number],
  cameraLookAt: [0, 3, -10] as [number, number, number],

  // Target paths — run on the ground across field
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

  // Football projectile
  footballScale: 0.004,
  footballSpeed: 30,
  footballArcHeight: 0.8,
  footballLifetimeSeconds: 2,
} as const

/** Pick a random target type using weighted distribution */
export function pickFootballTarget(): FootballTargetType {
  const totalWeight = FOOTBALL_TARGET_TYPES.reduce((sum, t) => sum + t.weight, 0)
  let roll = Math.random() * totalWeight
  for (const t of FOOTBALL_TARGET_TYPES) {
    roll -= t.weight
    if (roll <= 0) return t
  }
  return FOOTBALL_TARGET_TYPES[0]
}

export function getFootballDefenders(difficulty: Difficulty): DefenderLane[] {
  const configs: Record<Difficulty, DefenderLane[]> = {
    easy: [
      { z: -4, speed: 2.0, direction: 1, skinUrl: DEFENDER_SKINS[0] },
    ],
    medium: [
      { z: -3, speed: 2.5, direction: 1, skinUrl: DEFENDER_SKINS[0] },
      { z: -8, speed: 3.0, direction: -1, skinUrl: DEFENDER_SKINS[1] },
    ],
    hard: [
      { z: -2, speed: 3.0, direction: 1, skinUrl: DEFENDER_SKINS[0] },
      { z: -6, speed: 3.5, direction: -1, skinUrl: DEFENDER_SKINS[1] },
      { z: -10, speed: 4.0, direction: 1, skinUrl: DEFENDER_SKINS[2] },
      { z: -14, speed: 4.5, direction: -1, skinUrl: DEFENDER_SKINS[3] },
    ],
  }
  return configs[difficulty]
}

export function getFootballConfig(difficulty: Difficulty) {
  const tier = DIFFICULTY_TIERS[difficulty].football
  return {
    ...FOOTBALL_CONFIG,
    roundTimeSeconds: tier.roundTimeSeconds,
    maxTargets: tier.maxTargets,
    targetSpeedScale: tier.targetSpeedScale,
    targetSizeScale: tier.targetSizeScale,
  }
}
