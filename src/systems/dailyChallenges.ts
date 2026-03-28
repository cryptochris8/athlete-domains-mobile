import type { Scene } from '@/types'

export interface DailyChallenge {
  id: string
  game: Scene
  description: string
  target: number
  reward: number // coins
}

const CHALLENGE_TEMPLATES: { game: Scene; descriptions: { desc: string; target: number }[] }[] = [
  {
    game: 'basketball',
    descriptions: [
      { desc: 'Score {target} points in basketball', target: 30 },
      { desc: 'Score {target} points in basketball', target: 50 },
      { desc: 'Get a {target}-shot streak in basketball', target: 3 },
    ],
  },
  {
    game: 'soccer',
    descriptions: [
      { desc: 'Score {target} goals in soccer', target: 2 },
      { desc: 'Score {target} goals in soccer', target: 3 },
      { desc: 'Score {target} goals in soccer', target: 4 },
    ],
  },
  {
    game: 'bowling',
    descriptions: [
      { desc: 'Score {target} pins in bowling', target: 40 },
      { desc: 'Score {target} pins in bowling', target: 60 },
      { desc: 'Get a strike in bowling', target: 1 },
    ],
  },
  {
    game: 'minigolf',
    descriptions: [
      { desc: 'Complete a hole under par', target: 1 },
      { desc: 'Finish mini-golf in {target} or fewer strokes', target: 30 },
      { desc: 'Get a par or better on {target} holes', target: 3 },
    ],
  },
  {
    game: 'archery',
    descriptions: [
      { desc: 'Score {target} points in archery', target: 50 },
      { desc: 'Score {target} points in archery', target: 100 },
      { desc: 'Hit {target} targets in archery', target: 10 },
    ],
  },
  {
    game: 'football',
    descriptions: [
      { desc: 'Score {target} points in football', target: 50 },
      { desc: 'Score {target} points in football', target: 100 },
      { desc: 'Hit {target} targets in football', target: 10 },
    ],
  },
]

/**
 * Generates 3 daily challenges from a date-seeded pseudo-random.
 * Same date always produces the same challenges.
 */
export function generateDailyChallenges(date: Date = new Date()): DailyChallenge[] {
  // Simple date-based seed
  const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  let seed = 0
  for (let i = 0; i < dateStr.length; i++) {
    seed = ((seed << 5) - seed + dateStr.charCodeAt(i)) | 0
  }

  const seededRandom = () => {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed & 0x7fffffff) / 0x7fffffff
  }

  // Pick 3 different games (Fisher-Yates shuffle for uniform distribution)
  const shuffledGames = [...CHALLENGE_TEMPLATES]
  for (let i = shuffledGames.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    ;[shuffledGames[i], shuffledGames[j]] = [shuffledGames[j], shuffledGames[i]]
  }
  const selected = shuffledGames.slice(0, 3)

  return selected.map((template, i) => {
    const descIdx = Math.floor(seededRandom() * template.descriptions.length)
    const entry = template.descriptions[descIdx]
    const description = entry.desc.replace('{target}', String(entry.target))
    const reward = 5 + Math.floor(seededRandom() * 3) * 5 // 5, 10, or 15 coins

    return {
      id: `daily-${dateStr}-${i}`,
      game: template.game,
      description,
      target: entry.target,
      reward,
    }
  })
}

export function getTodayDateKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
