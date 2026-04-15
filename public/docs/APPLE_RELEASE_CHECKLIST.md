# Athlete Domains iOS — Apple Release Checklist

Last updated: 2026-04-14

---

## 1. Apple Developer Portal

### App ID Registration
- **Bundle ID:** `com.athletedomains.ios`
- **Register at:** https://developer.apple.com/account/resources/identifiers
- Ensure the App ID exists with the capabilities below enabled

### Capabilities to Enable on App ID
| Capability | Needed By | Notes |
|---|---|---|
| Sign in with Apple | `src/services/authService.ts` | Used for Apple OAuth login |
| In-App Purchase | `src/services/iapService.ts` | Required for all 7 IAP products |
| Push Notifications | `capacitor.config.ts`, `pushService.ts` | For Firebase Cloud Messaging via APNs |

### APNs Key (Push Notifications)
- Create an **APNs Authentication Key (.p8)** at: https://developer.apple.com/account/resources/authkeys
- Upload the .p8 key to **Firebase Console > Project Settings > Cloud Messaging > Apple app configuration**
- This enables Firebase to deliver push notifications to iOS devices

---

## 2. App Store Connect

### App Listing
| Field | Value |
|---|---|
| Bundle ID | `com.athletedomains.ios` |
| App Name | Athlete Domains (or chosen name) |
| Primary Language | English |
| SKU | e.g. `athletedomains001` |
| Content Rating | Fill out questionnaire in App Store Connect |
| Category | Games > Sports |

### In-App Purchase Products (7 total)

Create each of these in **App Store Connect > Your App > In-App Purchases**:

| Product ID | Type | Display Name | Description | Price |
|---|---|---|---|---|
| `remove_ads` | Non-Consumable | Remove Ads | Remove all ads permanently | You set |
| `coins_1000` | Consumable | 1,000 Coins | 1,000 in-game coins | You set |
| `coins_4000` | Consumable | 4,000 Coins | 4,000 in-game coins | You set |
| `coins_8000` | Consumable | 8,000 Coins | 8,000 in-game coins | You set |
| `starter_pack` | Non-Consumable | Starter Pack | 500 coins + starter avatars | You set |
| `elite_pack` | Consumable | Elite Pack | 5 avatars (1 Epic+ guaranteed) | You set |
| `legendary_pack` | Consumable | Legendary Pack | 3 avatars (1 Legendary guaranteed) | You set |

Each product needs:
- Display name and description
- Price tier selected
- Screenshot of the purchase UI (for review)
- Review notes explaining what the purchase grants

### App Store Connect API Key (for Codemagic CI/CD)
1. Go to **Users and Access > Integrations > App Store Connect API**
2. Create a key with **App Manager** role
3. Download the `.p8` file (you can only download it once)
4. Note the **Key ID** and **Issuer ID**
5. Add to Codemagic under **Teams > Integrations > App Store Connect**

---

## 3. Firebase Console

| Item | Action | Location |
|---|---|---|
| Register iOS app | Add iOS app with bundle `com.athletedomains.ios` | Firebase Console > Project Settings > General > Your apps |
| Download GoogleService-Info.plist | Include in iOS build (Capacitor copies this during `cap sync`) | Same location as above |
| Enable Apple Sign-In provider | Turn on in Authentication > Sign-in method | Firebase Console > Authentication |
| Enable Google Sign-In provider | Verify enabled with correct OAuth client | Firebase Console > Authentication |
| Upload APNs key | Upload .p8 for push notifications | Firebase Console > Project Settings > Cloud Messaging |

### Current Firebase Config (from `src/core/firebase.ts`)
```
Project ID: athlete-domains
Auth Domain: athlete-domains.firebaseapp.com
Storage Bucket: athlete-domains.firebasestorage.app
Messaging Sender ID: 542808154613
App ID: 1:542808154613:web:f5765059f060c8994ac0bc
```

---

## 4. AdMob (Google)

| Item | Current Value | Action |
|---|---|---|
| Ad Unit ID (rewarded) | `ca-app-pub-3940256099942544/5224354917` (TEST) | Replace with production ID from admob.google.com |
| AdMob iOS App ID | Not set | Create iOS app in AdMob console, get App ID |
| Info.plist GADApplicationIdentifier | Not set | Add AdMob App ID to iOS Info.plist (Capacitor plugin may handle this) |

### Where to update in code
- **Ad Unit ID:** `src/services/adService.ts` (line ~79, replace test ID)
- **AdMob App ID:** Added to iOS project via Capacitor AdMob plugin config

---

## 5. Codemagic CI/CD

### Environment Variables Needed in Codemagic UI
| Group/Variable | Description |
|---|---|
| `app_store_credentials` env group | Must contain App Store Connect API key info |
| App Store Connect integration named "Codemagic" | Linked under Teams > Integrations |
| iOS code signing | Auto-managed if API key has App Manager role |

### Codemagic Workflow
- **Production:** `ios-build` — triggers on push to `main` or `release/*`
- **Debug:** `ios-debug` — triggers on push to `develop` or `feature/*`
- **Notification email:** `chris@athletedomains.com` (verify this is correct)

### Build Pipeline
```
npm ci → tsc type check → vitest → vite build → cap sync ios →
configure entitlements → set version → pod install → xcode build →
publish to TestFlight
```

---

## 6. Before Public App Store Release (not needed for TestFlight)

| Item | Notes |
|---|---|
| App Store screenshots | iPhone 6.7", 6.5", 5.5" sizes minimum |
| App description | Focus on sports mini-games, avatar collection, cosmetics |
| Keywords | sports, games, basketball, soccer, bowling, archery, avatars |
| Privacy policy URL | Required — host at athletedomains.com or similar |
| App privacy nutrition labels | Declare data usage (analytics, auth, purchases) |
| Age rating questionnaire | Complete in App Store Connect |
| App review notes | Explain demo account for reviewers, IAP testing instructions |

---

## 7. App Store Safety — NFT Language Rules

Per the V1 strategy, the app listing and all in-app copy must NOT:
- Mention NFT ownership unlocking app content
- Claim NFT rarity grants in-app coins or power
- Reference blockchain wallets or crypto purchases
- Bypass App Store payment rails

The NFT collection is marketed separately as future Hytopia utility and community identity. The iOS app is marketed independently as a sports mini-games app with avatar collection.

---

## 8. Not Needed Yet (Future)

| Item | When |
|---|---|
| Apple receipt validation shared secret | When enabling production receipt verification in Cloud Functions |
| App Store promotional artwork | For featuring requests |
| App Clips / Widgets | V2+ |
| HealthKit / GameCenter integration | V2+ |

---

## Quick Reference: All Product IDs

```
Bundle ID:        com.athletedomains.ios
IAP:              remove_ads, coins_1000, coins_4000, coins_8000,
                  starter_pack, elite_pack, legendary_pack
AdMob Test Unit:  ca-app-pub-3940256099942544/5224354917
Firebase Project: athlete-domains
```
