import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../core/firebase';
import { getCurrentUser } from './authService';
import type { Achievement, GameResult } from '../types';

// ── Types ──────────────────────────────────────────────

/** Shape of the player document in Firestore */
export interface PlayerDoc {
  // Profile
  name: string;
  coins: number;
  totalXP: number;
  skinId: number;

  // Avatars & cosmetics
  ownedAvatarIds: number[];
  activeAvatarId: number;
  ownedCosmeticIds: string[];
  equippedShirt: string | null;
  equippedShoes: string | null;

  // Monetization flags
  adsRemoved: boolean;
  starterPackPurchased: boolean;
  founderBadge: boolean;
  claimedStarterBundle: boolean;

  // Progress
  achievements: Achievement[];
  unlockedGames: string[];
  totalStars: number;

  // Scores
  highScores: Record<string, number>;
  history: GameResult[];

  // Daily rewards
  dailyStreak: number;
  lastClaimDate: string | null;

  // Metadata
  updatedAt: ReturnType<typeof serverTimestamp>;
  createdAt: ReturnType<typeof serverTimestamp>;
}

// ── Helpers ────────────────────────────────────────────

function playerRef(uid: string) {
  return doc(db, 'players', uid);
}

function requireUid(): string {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  return user.uid;
}

// ── Read ───────────────────────────────────────────────

/** Load player data from Firestore. Returns null if no document exists. */
export async function loadPlayerData(): Promise<PlayerDoc | null> {
  const uid = requireUid();
  const snap = await getDoc(playerRef(uid));
  return snap.exists() ? (snap.data() as PlayerDoc) : null;
}

// ── Write ──────────────────────────────────────────────

/** Create initial player document (first sign-in). */
export async function createPlayerDoc(
  data: Omit<PlayerDoc, 'updatedAt' | 'createdAt'>
): Promise<void> {
  const uid = requireUid();
  await setDoc(playerRef(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Merge partial updates into the player document. */
export async function syncPlayerData(
  partial: Partial<Omit<PlayerDoc, 'createdAt'>>
): Promise<void> {
  const uid = requireUid();
  const ref = playerRef(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, {
      ...partial,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Document was deleted or doesn't exist — recreate
    await setDoc(ref, {
      ...partial,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// ── Convenience helpers for common sync events ─────────

/** Sync coins after earning or spending. */
export async function syncCoins(coins: number): Promise<void> {
  await syncPlayerData({ coins });
}

/** Sync after opening a pack (new avatars + coin change). */
export async function syncAfterPackOpen(
  coins: number,
  ownedAvatarIds: number[]
): Promise<void> {
  await syncPlayerData({ coins, ownedAvatarIds });
}

/** Sync after a match ends (high scores + stars + achievements). */
export async function syncAfterMatch(data: {
  highScores: Record<string, number>;
  totalStars: number;
  achievements: Achievement[];
  coins: number;
}): Promise<void> {
  await syncPlayerData(data);
}

/** Sync after equipping cosmetics. */
export async function syncEquipped(
  equippedShirt: string | null,
  equippedShoes: string | null
): Promise<void> {
  await syncPlayerData({ equippedShirt, equippedShoes });
}

/** Sync daily reward claim. */
export async function syncDailyReward(
  coins: number,
  dailyStreak: number,
  lastClaimDate: string
): Promise<void> {
  await syncPlayerData({ coins, dailyStreak, lastClaimDate });
}

/** Sync after IAP (coins, adsRemoved, starterPackPurchased). */
export async function syncAfterPurchase(data: {
  coins: number;
  adsRemoved?: boolean;
  starterPackPurchased?: boolean;
}): Promise<void> {
  await syncPlayerData(data);
}
