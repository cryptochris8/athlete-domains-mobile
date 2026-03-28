import { STAR_THRESHOLDS } from '@/core/constants'

export function getStarRating(game: string, score: number): number {
  const thresholds = STAR_THRESHOLDS[game as keyof typeof STAR_THRESHOLDS]
  if (!thresholds) return 0

  if (game === 'minigolf') {
    // Lower score is better for golf
    if (score <= thresholds.three) return 3
    if (score <= thresholds.two) return 2
    if (score <= thresholds.one) return 1
    return 0
  }

  if (score >= thresholds.three) return 3
  if (score >= thresholds.two) return 2
  if (score >= thresholds.one) return 1
  return 0
}

export function getGameCoins(stars: number, isNewHighScore: boolean): number {
  const starCoins = [0, 5, 10, 15][stars] ?? 0
  return starCoins + (isNewHighScore ? 5 : 0)
}

export function getScoreLabel(_game: string, stars: number): string {
  if (stars === 3) return 'Amazing!'
  if (stars === 2) return 'Great job!'
  if (stars === 1) return 'Good try!'
  return 'Keep practicing!'
}
