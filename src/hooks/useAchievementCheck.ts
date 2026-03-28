import { useCallback } from 'react'
import { useScoreStore } from '@/stores/useScoreStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useGameStore } from '@/stores/useGameStore'
import { checkAchievements, type AchievementContext } from '@/systems/achievements'
import { audioManager } from '@/core/AudioManager'

/**
 * Returns a function that evaluates achievement conditions
 * after a game ends. Call it in `endGame()` or GameOverScreen.
 */
export function useAchievementCheck() {
  const highScores = useScoreStore((s) => s.highScores)
  const history = useScoreStore((s) => s.history)
  const totalStars = useProgressStore((s) => s.totalStars)
  const unlockedGames = useProgressStore((s) => s.unlockedGames)
  const achievements = useProgressStore((s) => s.achievements)
  const unlockAchievement = useProgressStore((s) => s.unlockAchievement)
  const selectedDifficulty = useGameStore((s) => s.selectedDifficulty)

  const checkAndUnlock = useCallback(() => {
    const ctx: AchievementContext = {
      totalStars,
      unlockedGames,
      highScores,
      history: history.map((h) => ({ game: h.game, score: h.score, stars: h.stars, difficulty: h.difficulty })),
      totalCorrect: 0,
      totalAnswered: 0,
      educationStreak: 0,
      achievements,
      selectedDifficulty,
    }

    const newlyUnlocked = checkAchievements(ctx)
    for (const achievement of newlyUnlocked) {
      unlockAchievement(achievement)
      audioManager.play('unlock')
    }

    return newlyUnlocked
  }, [totalStars, unlockedGames, highScores, history, achievements, unlockAchievement, selectedDifficulty])

  return checkAndUnlock
}
