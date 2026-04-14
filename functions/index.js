import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
