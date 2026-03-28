import { ALL_SPORT_KEYS, type Achievement } from '@/types'

export interface AchievementContext {
  totalStars: number
  unlockedGames: string[]
  highScores: Record<string, number>
  history: { game: string; score: number; stars: number; difficulty?: string }[]
  totalCorrect: number
  totalAnswered: number
  educationStreak: number
  achievements: Achievement[]
  selectedDifficulty: string
}

export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  check: (ctx: AchievementContext) => boolean
}

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  // Cross-game: star milestones
  {
    id: 'first-star', name: 'Rising Star', description: 'Earn your first star', icon: 'star',
    check: (ctx) => ctx.totalStars >= 1,
  },
  {
    id: 'star-10', name: 'Star Collector', description: 'Earn 10 total stars', icon: 'stars',
    check: (ctx) => ctx.totalStars >= 10,
  },
  {
    id: 'star-25', name: 'Star Seeker', description: 'Earn 25 total stars', icon: 'stars',
    check: (ctx) => ctx.totalStars >= 25,
  },
  {
    id: 'star-50', name: 'Superstar', description: 'Earn 50 total stars', icon: 'trophy',
    check: (ctx) => ctx.totalStars >= 50,
  },

  // Cross-game: unlock & play
  {
    id: 'all-unlocked', name: 'All Access', description: 'Unlock all six games', icon: 'unlock',
    check: (ctx) => ALL_SPORT_KEYS.every((g) => ctx.unlockedGames.includes(g)),
  },
  {
    id: 'all-played', name: 'Well Rounded', description: 'Play all six games', icon: 'games',
    check: (ctx) => ALL_SPORT_KEYS.every(
      (g) => ctx.history.some((h) => h.game === g),
    ),
  },
  {
    id: 'first-game', name: 'Welcome!', description: 'Complete your first game', icon: 'wave',
    check: (ctx) => ctx.history.length >= 1,
  },
  {
    id: 'five-games', name: 'Getting Warmed Up', description: 'Complete 5 games', icon: 'fire',
    check: (ctx) => ctx.history.length >= 5,
  },
  {
    id: 'ten-games', name: 'Dedicated Athlete', description: 'Complete 10 games', icon: 'medal',
    check: (ctx) => ctx.history.length >= 10,
  },

  // Per-game achievements
  {
    id: 'basketball-3star', name: 'Baller', description: 'Earn 3 stars in basketball', icon: 'basketball',
    check: (ctx) => ctx.history.some((h) => h.game === 'basketball' && h.stars >= 3),
  },
  {
    id: 'hat-trick', name: 'Hat Trick Hero', description: 'Score 3+ goals in soccer', icon: 'soccer',
    check: (ctx) => ctx.history.some((h) => h.game === 'soccer' && h.score >= 3),
  },
  {
    id: 'bowling-3star', name: 'Pin Master', description: 'Earn 3 stars in bowling', icon: 'bowling',
    check: (ctx) => ctx.history.some((h) => h.game === 'bowling' && h.stars >= 3),
  },
  {
    id: 'golf-3star', name: 'Golf Pro', description: 'Earn 3 stars in mini-golf', icon: 'golf',
    check: (ctx) => ctx.history.some((h) => h.game === 'minigolf' && h.stars >= 3),
  },
  {
    id: 'air-ball', name: 'Air Ball', description: 'Finish basketball with 0 points', icon: 'whoops',
    check: (ctx) => ctx.history.some((h) => h.game === 'basketball' && h.score === 0),
  },
  {
    id: 'archery-3star', name: 'Sharpshooter', description: 'Earn 3 stars in archery', icon: 'archery',
    check: (ctx) => ctx.history.some((h) => h.game === 'archery' && h.stars >= 3),
  },

  // Education achievements
  {
    id: 'quiz-5', name: 'Quick Learner', description: 'Answer 5 questions correctly', icon: 'brain',
    check: (ctx) => ctx.totalCorrect >= 5,
  },
  {
    id: 'quiz-20', name: 'Quiz Whiz', description: 'Answer 20 questions correctly', icon: 'brain',
    check: (ctx) => ctx.totalCorrect >= 20,
  },
  {
    id: 'quiz-streak-5', name: 'On a Roll', description: 'Get a 5-question correct streak', icon: 'fire',
    check: (ctx) => ctx.educationStreak >= 5,
  },
  {
    id: 'quiz-streak-10', name: 'Quiz Master', description: 'Get a 10-question correct streak', icon: 'fire',
    check: (ctx) => ctx.educationStreak >= 10,
  },
  {
    id: 'perfect-accuracy', name: 'Perfect Score', description: '100% quiz accuracy (10+ questions)', icon: 'bullseye',
    check: (ctx) => ctx.totalAnswered >= 10 && ctx.totalCorrect === ctx.totalAnswered,
  },
  {
    id: 'quiz-50', name: 'Studious', description: 'Answer 50 quiz questions total', icon: 'book',
    check: (ctx) => ctx.totalAnswered >= 50,
  },

  // Football achievements
  {
    id: 'football-first', name: 'First Down', description: 'Complete a football game', icon: 'football',
    check: (ctx) => ctx.history.some((h) => h.game === 'football'),
  },
  {
    id: 'football-3star', name: 'Quarterback', description: 'Earn 3 stars in football', icon: 'football',
    check: (ctx) => ctx.history.some((h) => h.game === 'football' && h.stars >= 3),
  },
  {
    id: 'football-100', name: 'Century Pass', description: 'Score 100+ in football', icon: 'football',
    check: (ctx) => ctx.history.some((h) => h.game === 'football' && h.score >= 100),
  },

  // Mastery achievements
  {
    id: 'bowling-perfect', name: 'Perfect Game', description: 'Score 150+ in bowling', icon: 'bowling',
    check: (ctx) => ctx.history.some((h) => h.game === 'bowling' && h.score >= 150),
  },
  {
    id: 'golf-hole-in-one', name: 'Hole in One', description: 'Finish mini-golf in 9 or fewer strokes', icon: 'golf',
    check: (ctx) => ctx.history.some((h) => h.game === 'minigolf' && h.score <= 9),
  },
  {
    id: 'archery-sharpshooter', name: 'Eagle Eye', description: 'Score 200+ in archery', icon: 'archery',
    check: (ctx) => ctx.history.some((h) => h.game === 'archery' && h.score >= 200),
  },
  {
    id: 'soccer-clean-sheet', name: 'Clean Sheet', description: 'Score 5+ goals in soccer', icon: 'soccer',
    check: (ctx) => ctx.history.some((h) => h.game === 'soccer' && h.score >= 5),
  },
  {
    id: 'basketball-60', name: 'Slam Dunk King', description: 'Score 60+ in basketball', icon: 'basketball',
    check: (ctx) => ctx.history.some((h) => h.game === 'basketball' && h.score >= 60),
  },

  // Difficulty achievements
  {
    id: 'win-easy', name: 'Easy Breezy', description: 'Earn 3 stars on easy difficulty', icon: 'star',
    check: (ctx) => ctx.history.some((h) => h.stars >= 3 && h.difficulty === 'easy'),
  },
  {
    id: 'win-medium', name: 'Stepping Up', description: 'Earn 3 stars on medium difficulty', icon: 'star',
    check: (ctx) => ctx.history.some((h) => h.stars >= 3 && h.difficulty === 'medium'),
  },
  {
    id: 'win-hard', name: 'Champion', description: 'Earn 3 stars on hard difficulty', icon: 'trophy',
    check: (ctx) => ctx.history.some((h) => h.stars >= 3 && h.difficulty === 'hard'),
  },

  // Cumulative achievements
  {
    id: 'twenty-five-games', name: 'Sports Fanatic', description: 'Complete 25 games', icon: 'fire',
    check: (ctx) => ctx.history.length >= 25,
  },
  {
    id: 'fifty-games', name: 'Legend', description: 'Complete 50 games', icon: 'trophy',
    check: (ctx) => ctx.history.length >= 50,
  },
  {
    id: 'star-100', name: 'Constellation', description: 'Earn 100 total stars', icon: 'stars',
    check: (ctx) => ctx.totalStars >= 100,
  },
  {
    id: 'total-score-500', name: 'High Roller', description: 'Accumulate 500+ total score (excl. mini-golf)', icon: 'medal',
    check: (ctx) => ctx.history
      .filter((h) => h.game !== 'minigolf')
      .reduce((sum, h) => sum + h.score, 0) >= 500,
  },

  // Cross-game achievements
  {
    id: 'three-star-trio', name: 'Triple Threat', description: 'Earn 3 stars in 3 different games', icon: 'stars',
    check: (ctx) => {
      const gamesWithThreeStars = new Set(
        ctx.history.filter((h) => h.stars >= 3).map((h) => h.game),
      )
      return gamesWithThreeStars.size >= 3
    },
  },
  {
    id: 'three-star-all', name: 'Perfectionist', description: 'Earn 3 stars in all 6 games', icon: 'trophy',
    check: (ctx) => ALL_SPORT_KEYS.every(
      (g) => ctx.history.some((h) => h.game === g && h.stars >= 3),
    ),
  },
  {
    id: 'hard-trio', name: 'Hardcore', description: 'Earn 3 stars on hard in 3 different games', icon: 'trophy',
    check: (ctx) => {
      const gamesWithHardThreeStars = new Set(
        ctx.history.filter((h) => h.stars >= 3 && h.difficulty === 'hard').map((h) => h.game),
      )
      return gamesWithHardThreeStars.size >= 3
    },
  },

  // Education milestones
  {
    id: 'quiz-100', name: 'Scholar', description: 'Answer 100 questions correctly', icon: 'brain',
    check: (ctx) => ctx.totalCorrect >= 100,
  },
  {
    id: 'quiz-streak-20', name: 'Unstoppable', description: 'Get a 20-question correct streak', icon: 'fire',
    check: (ctx) => ctx.educationStreak >= 20,
  },
]

/**
 * Evaluates all achievements against context and returns newly unlocked ones.
 * Pure function — does not read from or write to stores.
 */
export function checkAchievements(ctx: AchievementContext): Achievement[] {
  const earnedIds = new Set(ctx.achievements.map((a) => a.id))
  const newUnlocks: Achievement[] = []

  for (const def of ACHIEVEMENT_CATALOG) {
    if (earnedIds.has(def.id)) continue
    try {
      if (def.check(ctx)) {
        newUnlocks.push({
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
        })
      }
    } catch {
      // Ignore check errors
    }
  }

  return newUnlocks
}
