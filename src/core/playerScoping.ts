import { useScoreStore } from '@/stores/useScoreStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { ALL_SPORT_KEYS } from '@/types'


function storageKey(store: string, profileId: number): string {
  return `ad-ios-${store}-${profileId}`
}

/** Save current store states under the given profileId */
function saveStores(profileId: number) {
  const scores = useScoreStore.getState()
  const progress = useProgressStore.getState()

  localStorage.setItem(storageKey('scores', profileId), JSON.stringify({
    state: {
      currentScore: scores.currentScore,
      currentStreak: scores.currentStreak,
      highScores: scores.highScores,
      history: scores.history,
    },
  }))

  localStorage.setItem(storageKey('progress', profileId), JSON.stringify({
    state: {
      unlockedGames: progress.unlockedGames,
      totalStars: progress.totalStars,
      achievements: progress.achievements,
    },
  }))

  // Save monetization fields from the player profile
  const playerStore = usePlayerStore.getState()
  const profile = playerStore.profiles.find((p) => p.id === profileId)
  if (profile) {
    localStorage.setItem(storageKey('monetization', profileId), JSON.stringify({
      state: {
        ownedAvatarIds: profile.ownedAvatarIds ?? [],
        ownedCosmeticIds: profile.ownedCosmeticIds ?? [],
        equippedShirt: profile.equippedShirt ?? null,
        equippedShoes: profile.equippedShoes ?? null,
        adsRemoved: profile.adsRemoved ?? false,
        starterPackPurchased: profile.starterPackPurchased ?? false,
      },
    }))
  }
}

/** Load store states for the given profileId (or use defaults) */
function loadStores(profileId: number) {
  // Scores
  const scoresRaw = localStorage.getItem(storageKey('scores', profileId))
  if (scoresRaw) {
    try {
      const { state } = JSON.parse(scoresRaw)
      useScoreStore.setState({
        currentScore: 0,
        currentStreak: 0,
        highScores: state.highScores ?? {},
        history: state.history ?? [],
      })
    } catch { /* use defaults */ }
  } else {
    useScoreStore.setState({ currentScore: 0, currentStreak: 0, highScores: {}, history: [] })
  }

  // Progress
  const progressRaw = localStorage.getItem(storageKey('progress', profileId))
  if (progressRaw) {
    try {
      const { state } = JSON.parse(progressRaw)
      useProgressStore.setState({
        unlockedGames: state.unlockedGames ?? ['basketball'],
        totalStars: state.totalStars ?? 0,
        achievements: state.achievements ?? [],
      })
    } catch { /* use defaults */ }
  } else {
    useProgressStore.setState({
      unlockedGames: [...ALL_SPORT_KEYS],
      totalStars: 0,
      achievements: [],
    })
  }

  // Monetization fields
  const monetizationRaw = localStorage.getItem(storageKey('monetization', profileId))
  if (monetizationRaw) {
    try {
      const { state } = JSON.parse(monetizationRaw)
      usePlayerStore.getState().updateProfile(profileId, {
        ownedAvatarIds: state.ownedAvatarIds ?? [1, 100, 250, 500, 750],
        ownedCosmeticIds: state.ownedCosmeticIds ?? [],
        equippedShirt: state.equippedShirt ?? null,
        equippedShoes: state.equippedShoes ?? null,
        adsRemoved: state.adsRemoved ?? false,
        starterPackPurchased: state.starterPackPurchased ?? false,
      })
    } catch { /* use defaults */ }
  } else {
    usePlayerStore.getState().updateProfile(profileId, {
      ownedAvatarIds: [1, 100, 250, 500, 750],
      ownedCosmeticIds: [],
      equippedShirt: null,
      equippedShoes: null,
      adsRemoved: false,
      starterPackPurchased: false,
    })
  }
}

let currentProfileId: number | null = null

/**
 * Switch all player-scoped stores to a different profile.
 * Saves the current profile's data first, then loads the new profile.
 */
export function switchPlayerStores(newProfileId: number) {
  if (currentProfileId === newProfileId) return

  // Save current profile data
  if (currentProfileId !== null) {
    saveStores(currentProfileId)
  }

  // Load new profile data
  loadStores(newProfileId)
  currentProfileId = newProfileId
}

/**
 * Save the current player's store data (call before app unload or on game over).
 */
export function saveCurrentPlayer() {
  if (currentProfileId !== null) {
    saveStores(currentProfileId)
  }
}
