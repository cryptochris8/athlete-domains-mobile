# Recommended Data Models

## AvatarDefinition
Fields:
- id: string
- name: string
- sport: string
- rarity: string
- thumbnailUrl: string
- assetUrl: string
- founderCollection: boolean
- collectionTag: string | null
- isStarter: boolean
- isActive: boolean

## CosmeticItem
Fields:
- id: string
- category: string
- name: string
- rarity: string
- thumbnailUrl: string
- assetUrl: string | null
- founderCollection: boolean

## PackDefinition
Fields:
- id: string
- name: string
- priceCoins: number | null
- priceUSD: string | null
- itemCount: number
- guaranteedRarity: string | null
- odds: object
- enabled: boolean

## PlayerInventory
Fields:
- userId: string
- ownedAvatarIds: string[]
- ownedCosmeticIds: string[]
- selectedAvatarId: string
- equippedShirtId: string | null
- equippedShoesId: string | null
- coinBalance: number
- adsRemoved: boolean
- founderBadge: boolean
- claimedStarterBundle: boolean

## PackOpenResult
Fields:
- resultId: string
- userId: string
- packId: string
- awardedAvatarIds: string[]
- duplicateCoinValue: number
- createdAt: string

## FounderProfile
Fields:
- userId: string
- founderBadge: boolean
- founderTier: string | null
- source: string
- notes: string | null

## NFT Mapping Record (Off-App / Optional)
This should not drive in-app gating logic directly.

Fields:
- tokenId: string
- nftCollection: string
- avatarIdReference: string
- rarity: string
- metadataUrl: string
- futureUtilityStatus: string

## Notes
- Keep V1 models simple.
- Avoid mixing blockchain fields into core in-app entitlement models.
- Keep NFT mapping as a separate optional dataset.
