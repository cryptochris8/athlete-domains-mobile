export type GameMode = 'classic' | 'timeAttack' | 'accuracy' | 'endless'

export interface GameModeConfig {
  id: GameMode
  name: string
  description: string
}

export const GAME_MODES: GameModeConfig[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Standard game with quiz breaks',
  },
  {
    id: 'timeAttack',
    name: 'Time Attack',
    description: 'Race the clock, no quizzes',
  },
  {
    id: 'accuracy',
    name: 'Accuracy',
    description: 'Fewer shots, higher stakes',
  },
  {
    id: 'endless',
    name: 'Endless',
    description: 'Keep playing until you miss',
  },
]

export function getGameMode(id: GameMode): GameModeConfig {
  return GAME_MODES.find((m) => m.id === id) ?? GAME_MODES[0]
}
