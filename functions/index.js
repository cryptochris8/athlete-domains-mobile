import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();
const db = getFirestore();

/**
 * Validate an Apple App Store receipt and grant the purchased items.
 *
 * Called from the client after a successful IAP.
 * In production, this would verify the receipt with Apple's /verifyReceipt endpoint.
 * For now it validates the structure and records the purchase in Firestore.
 */
export const validateReceipt = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in');

  const { productId, receiptData, platform } = request.data ?? {};
  if (!productId || typeof productId !== 'string') {
    throw new HttpsError('invalid-argument', 'productId required');
  }

  // Record the purchase attempt
  const purchaseRef = db.collection('players').doc(uid).collection('purchases').doc();
  await purchaseRef.set({
    productId,
    platform: platform ?? 'ios',
    status: 'pending',
    receiptData: receiptData ?? null,
    createdAt: new Date(),
  });

  // ── Apple receipt verification ──
  // In production, uncomment and configure:
  //
  // const APPLE_VERIFY_URL = 'https://buy.itunes.apple.com/verifyReceipt';
  // const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
  // const SHARED_SECRET = process.env.APPLE_SHARED_SECRET;
  //
  // const response = await fetch(APPLE_VERIFY_URL, {
  //   method: 'POST',
  //   body: JSON.stringify({ 'receipt-data': receiptData, password: SHARED_SECRET }),
  // });
  // const result = await response.json();
  //
  // if (result.status === 21007) {
  //   // Sandbox receipt — retry against sandbox
  //   const sandboxResponse = await fetch(APPLE_SANDBOX_URL, { ... });
  //   ...
  // }
  //
  // if (result.status !== 0) {
  //   await purchaseRef.update({ status: 'invalid', appleStatus: result.status });
  //   throw new HttpsError('permission-denied', 'Receipt invalid');
  // }

  // Grant the items based on product ID
  const playerRef = db.collection('players').doc(uid);
  const playerSnap = await playerRef.get();
  const playerData = playerSnap.data() ?? {};

  const updates = {};

  switch (productId) {
    case 'remove_ads':
      updates.adsRemoved = true;
      break;
    case 'coins_1000':
      updates.coins = (playerData.coins ?? 0) + 1000;
      break;
    case 'coins_4000':
      updates.coins = (playerData.coins ?? 0) + 4000;
      break;
    case 'coins_8000':
      updates.coins = (playerData.coins ?? 0) + 8000;
      break;
    case 'starter_pack':
      updates.starterPackPurchased = true;
      updates.coins = (playerData.coins ?? 0) + 500;
      break;
    default:
      await purchaseRef.update({ status: 'unknown_product' });
      throw new HttpsError('invalid-argument', `Unknown product: ${productId}`);
  }

  // Apply updates atomically
  await db.runTransaction(async (t) => {
    t.update(playerRef, { ...updates, updatedAt: new Date() });
    t.update(purchaseRef, { status: 'verified', grantedAt: new Date() });
  });

  return { success: true, productId, granted: updates };
});

/**
 * Restore purchases — look up verified purchases for the user.
 */
export const restoreUserPurchases = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in');

  const purchasesSnap = await db
    .collection('players')
    .doc(uid)
    .collection('purchases')
    .where('status', '==', 'verified')
    .get();

  const productIds = purchasesSnap.docs.map((doc) => doc.data().productId);
  return { productIds: [...new Set(productIds)] };
});

// ── Push Notifications ────────────────────────────────

/**
 * Helper: send a push notification to a specific user.
 */
async function sendToUser(uid, title, body, data = {}) {
  const tokenSnap = await db
    .collection('players')
    .doc(uid)
    .collection('tokens')
    .doc('push')
    .get();

  if (!tokenSnap.exists) return false;

  const { token } = tokenSnap.data();
  if (!token) return false;

  try {
    await getMessaging().send({
      token,
      notification: { title, body },
      data: { ...data, type: data.type ?? 'general' },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
    });
    return true;
  } catch (err) {
    // Token is invalid — clean it up
    if (err.code === 'messaging/registration-token-not-registered') {
      await tokenSnap.ref.delete();
    }
    console.warn(`[Push] Failed to send to ${uid}:`, err.message);
    return false;
  }
}

/**
 * Scheduled: Daily reward reminder.
 * Runs every day at 6 PM UTC (~11 AM PT / 2 PM ET).
 * Notifies players who haven't claimed their daily reward today.
 */
export const dailyRewardReminder = onSchedule('every day 18:00', async () => {
  const today = new Date().toISOString().split('T')[0];

  // Find all players whose lastClaimDate is NOT today
  const playersSnap = await db.collection('players').get();

  let sent = 0;
  for (const playerDoc of playersSnap.docs) {
    const data = playerDoc.data();
    if (data.lastClaimDate === today) continue; // Already claimed

    const success = await sendToUser(
      playerDoc.id,
      'Daily Reward Ready! 🎁',
      data.dailyStreak > 0
        ? `Day ${(data.dailyStreak % 7) + 1} streak — don't lose it!`
        : 'Claim your free coins today!',
      { type: 'daily_reward' }
    );
    if (success) sent++;
  }

  console.log(`[DailyRewardReminder] Sent ${sent} notifications`);
});

/**
 * Scheduled: Streak warning.
 * Runs every day at 9 PM UTC.
 * Warns players with active streaks who haven't claimed yet.
 */
export const streakWarning = onSchedule('every day 21:00', async () => {
  const today = new Date().toISOString().split('T')[0];

  const playersSnap = await db
    .collection('players')
    .where('dailyStreak', '>', 0)
    .get();

  let sent = 0;
  for (const playerDoc of playersSnap.docs) {
    const data = playerDoc.data();
    if (data.lastClaimDate === today) continue; // Already claimed

    const success = await sendToUser(
      playerDoc.id,
      'Streak at Risk! 🔥',
      `Your ${data.dailyStreak}-day streak expires at midnight! Claim now.`,
      { type: 'streak_warning' }
    );
    if (success) sent++;
  }

  console.log(`[StreakWarning] Sent ${sent} notifications`);
});

/**
 * Callable: Send a test notification to the current user.
 * Useful for verifying push is configured correctly.
 */
export const sendTestNotification = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in');

  const success = await sendToUser(
    uid,
    'Test Notification 🏆',
    'Push notifications are working!',
    { type: 'test' }
  );

  return { success };
});
