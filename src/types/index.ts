export type Scene = 'menu' | 'basketball' | 'soccer' | 'bowling' | 'minigolf' | 'archery' | 'football' | 'soccer-match'

export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover'

export type Difficulty = 'easy' | 'medium' | 'hard'

export const ALL_SPORT_KEYS = ['football', 'basketball', 'soccer', 'archery', 'bowling', 'minigolf'] as const
export type SportKey = (typeof ALL_SPORT_KEYS)[number]

export type ControlScheme = 'wasd' | 'arrows'

export interface PlayerProfile {
  id: number
  name: string
  age: number
  avatar: string
  skinId: number
  coins: number
  totalXP: number
  createdAt: number
  _skinMigrated?: boolean
  ownedAvatarIds: number[]
  ownedCosmeticIds: string[]
  equippedShirt: string | null
  equippedShoes: string | null
  adsRemoved: boolean
  starterPackPurchased: boolean
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: number
}

export interface GameResult {
  game: Scene
  score: number
  stars: number
  date: number
  difficulty?: Difficulty
}

export interface StarRating {
  one: number
  two: number
  three: number
}
