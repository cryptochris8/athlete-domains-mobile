import { usePlayerStore } from '@/stores/usePlayerStore'
import { syncPlayerData } from '@/services/firestoreSync'

/**
 * FounderService — manages the cosmetic-only founder badge.
 * The badge is set server-side or via admin tools, not by the user.
 * In-app, we only read and display it.
 */

/** Check if the active player has the founder badge. */
export function hasFounderBadge(): boolean {
  const profile = usePlayerStore.getState().getActiveProfile()
  return profile?.founderBadge ?? false
}

/** Apply founder badge to the active profile (admin/server use). */
export async function applyFounderBadge(): Promise<void> {
  const store = usePlayerStore.getState()
  const profile = store.getActiveProfile()
  if (!profile) return

  store.updateProfile(profile.id, { founderBadge: true })
  await syncPlayerData({ founderBadge: true }).catch(() => {})
}

/** Remove founder badge from the active profile. */
export async function removeFounderBadge(): Promise<void> {
  const store = usePlayerStore.getState()
  const profile = store.getActiveProfile()
  if (!profile) return

  store.updateProfile(profile.id, { founderBadge: false })
  await syncPlayerData({ founderBadge: false }).catch(() => {})
}
