import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { onAuthChange, signInAnon } from '../services/authService';
import { loadPlayerData, createPlayerDoc } from '../services/firestoreSync';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useProgressStore } from '../stores/useProgressStore';
import { useScoreStore } from '../stores/useScoreStore';
import type { Achievement } from '../types';

/**
 * Hook that manages Firebase auth lifecycle:
 * 1. Listens for auth state changes
 * 2. Auto-signs in anonymously if no user
 * 3. Loads/creates Firestore player document
 * 4. Hydrates local Zustand stores from cloud data
 */
export function useFirebaseAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setError = useAuthStore((s) => s.setError);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          await hydrateFromCloud();
        } catch (err) {
          console.warn('Cloud sync failed, using local data:', err);
        }
      } else {
        // No user — auto sign in anonymously
        try {
          setLoading(true);
          await signInAnon();
          // onAuthChange will fire again with the new user
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Auth failed');
        }
      }
    });

    return unsubscribe;
  }, [setUser, setLoading, setError]);
}

/**
 * Load player data from Firestore and hydrate local stores.
 * If no cloud document exists, create one from current local state.
 */
async function hydrateFromCloud() {
  const cloudData = await loadPlayerData();
  const playerStore = usePlayerStore.getState();
  const profile = playerStore.getActiveProfile();

  if (cloudData) {
    // Cloud data exists — merge into active profile
    const profileId = playerStore.activeProfileId;
    if (profileId) {
      playerStore.updateProfile(profileId, {
        coins: cloudData.coins,
        totalXP: cloudData.totalXP,
        skinId: cloudData.skinId,
        ownedAvatarIds: cloudData.ownedAvatarIds,
        ownedCosmeticIds: cloudData.ownedCosmeticIds,
        equippedShirt: cloudData.equippedShirt,
        equippedShoes: cloudData.equippedShoes,
        adsRemoved: cloudData.adsRemoved,
        starterPackPurchased: cloudData.starterPackPurchased,
        founderBadge: cloudData.founderBadge ?? false,
        claimedStarterBundle: cloudData.claimedStarterBundle ?? true,
      });
    }

    // Hydrate progress store
    const progress = useProgressStore.getState();
    cloudData.achievements.forEach((a: Achievement) => progress.unlockAchievement(a));
    cloudData.unlockedGames.forEach((g: string) => progress.unlockGame(g));

    // Hydrate score store (replay results to rebuild high scores)
    const scores = useScoreStore.getState();
    if (cloudData.history) {
      cloudData.history.forEach((r) => {
        scores.saveResult(r.game, r.score, r.stars, r.difficulty);
      });
    }
  } else if (profile) {
    // First time — push local state to cloud
    const progress = useProgressStore.getState();
    const scores = useScoreStore.getState();

    await createPlayerDoc({
      name: profile.name,
      coins: profile.coins,
      totalXP: profile.totalXP,
      skinId: profile.skinId,
      ownedAvatarIds: profile.ownedAvatarIds,
      activeAvatarId: profile.skinId,
      ownedCosmeticIds: profile.ownedCosmeticIds,
      equippedShirt: profile.equippedShirt,
      equippedShoes: profile.equippedShoes,
      adsRemoved: profile.adsRemoved,
      starterPackPurchased: profile.starterPackPurchased,
      achievements: progress.achievements,
      unlockedGames: progress.unlockedGames,
      totalStars: progress.totalStars,
      highScores: scores.highScores,
      history: scores.history,
      dailyStreak: 0,
      lastClaimDate: null,
      founderBadge: profile.founderBadge ?? false,
      claimedStarterBundle: profile.claimedStarterBundle ?? true,
    });
  }
}
