import { logEvent } from 'firebase/analytics'
import { analyticsPromise } from '../core/firebase'

async function log(event: string, params?: Record<string, string | number>) {
  const analytics = await analyticsPromise
  if (analytics) {
    logEvent(analytics, event, params)
  }
}

// ── Game events ───────────────────────────────────────

export function trackGameStart(game: string, difficulty: string) {
  log('game_start', { game, difficulty })
}

export function trackGameEnd(game: string, score: number, stars: number, difficulty: string) {
  log('game_end', { game, score, stars, difficulty })
}

// ── Monetization events ───────────────────────────────

export function trackPackOpen(packType: string, avatarCount: number) {
  log('pack_open', { pack_type: packType, avatar_count: avatarCount })
}

export function trackShopPurchase(itemId: string, price: number) {
  log('shop_purchase', { item_id: itemId, price })
}

export function trackIAPPurchase(productId: string) {
  log('iap_purchase', { product_id: productId })
}

export function trackAdWatched(placement: string) {
  log('ad_watched', { placement })
}

export function trackDailyRewardClaim(day: number, coins: number, doubled: boolean) {
  log('daily_reward_claim', { day, coins, doubled: doubled ? 1 : 0 })
}

// ── Progress events ───────────────────────────────────

export function trackAchievementUnlock(achievementId: string) {
  log('achievement_unlock', { achievement_id: achievementId })
}

export function trackNewHighScore(game: string, score: number) {
  log('new_high_score', { game, score })
}
