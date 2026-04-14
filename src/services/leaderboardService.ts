import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../core/firebase'
import { getCurrentUser } from './authService'

export interface LeaderboardEntry {
  uid: string
  name: string
  score: number
  updatedAt: unknown
}

const LEADERBOARD_LIMIT = 50

function leaderboardRef(game: string) {
  return collection(db, 'leaderboards', game, 'scores')
}

/**
 * Submit a high score to the leaderboard.
 * Only updates if the new score is better than the existing one.
 */
export async function submitScore(
  game: string,
  score: number,
  playerName: string,
  isLowerBetter = false
): Promise<void> {
  const user = getCurrentUser()
  if (!user) return

  const scoreRef = doc(leaderboardRef(game), user.uid)
  const existing = await getDoc(scoreRef)

  if (existing.exists()) {
    const currentScore = existing.data().score ?? 0
    const isBetter = isLowerBetter
      ? score < currentScore
      : score > currentScore
    if (!isBetter) return
  }

  await setDoc(scoreRef, {
    uid: user.uid,
    name: playerName,
    score,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Get top scores for a game.
 */
export async function getTopScores(
  game: string,
  isLowerBetter = false
): Promise<LeaderboardEntry[]> {
  const q = query(
    leaderboardRef(game),
    orderBy('score', isLowerBetter ? 'asc' : 'desc'),
    limit(LEADERBOARD_LIMIT)
  )

  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as LeaderboardEntry)
}

/**
 * Get the current user's rank for a game.
 */
export async function getMyRank(
  game: string,
  isLowerBetter = false
): Promise<{ rank: number; score: number } | null> {
  const user = getCurrentUser()
  if (!user) return null

  const scoreRef = doc(leaderboardRef(game), user.uid)
  const myScore = await getDoc(scoreRef)
  if (!myScore.exists()) return null

  const myScoreVal = myScore.data().score

  // Count how many scores are better
  const betterQuery = query(
    leaderboardRef(game),
    where('score', isLowerBetter ? '<' : '>', myScoreVal)
  )
  const betterSnap = await getDocs(betterQuery)

  return { rank: betterSnap.size + 1, score: myScoreVal }
}
