# System Architecture

## Goal
Wire Athlete Domains into the existing mobile ecosystem using modular, lightweight services.

## Core Modules
### AvatarService
Responsibilities:
- fetch avatar definitions
- fetch rarity and metadata
- return starter avatars
- return thumbnails / asset references
- support pagination or virtualization

### InventoryService
Responsibilities:
- track owned avatar ids
- track owned cosmetic ids
- track selected avatar id
- track equipped shirt id
- track equipped shoes id
- persist current loadout
- expose locked vs owned state

### EconomyService
Responsibilities:
- manage coin balance
- award match coins
- award win bonus
- award daily reward
- validate pack cost
- spend coins
- convert duplicate avatars to coins

### PackService
Responsibilities:
- resolve pack reward before reveal animation
- use server-trusted or validated roll logic when possible
- save reward result before presentation
- support pack types and odds
- handle guaranteed rarity rules

### AdService
Responsibilities:
- rewarded ad availability
- ad completion callbacks
- reward validation
- ad suppression when remove ads is owned

### PurchaseService
Responsibilities:
- restore purchases
- remove ads purchase
- coin pack purchases
- starter pack purchase
- product mapping and receipt validation

### FounderService (Optional V1.1)
Responsibilities:
- apply OG/founder badge
- manage founder drop allowlist
- manage founder cosmetic markers
- expose founder status to UI

## Storage Strategy
### Local Storage
Use local persistence for:
- selected avatar id
- equipped shirt id
- equipped shoes id
- cached thumbnails
- recent UI state

### Remote Storage / Firebase
Use remote persistence for:
- owned avatar ids
- owned cosmetic ids
- coin balance
- founder flag if used
- ads removed state
- purchase-backed entitlements
- claimed starter rewards
- pack results and reward claims

## Sync Strategy
Only sync on major events:
- first account creation
- pack opened
- purchase completed
- reward claimed
- match ended
- selected loadout changed if needed

Do NOT write continuously during inventory browsing.

## Performance Rules
- do not load all avatars into memory at once
- lazy load thumbnails
- full asset only when needed
- virtualize large lists
- cache recently viewed items
- keep metadata lightweight

## UI Surfaces
### Locker Room
Primary customization hub.

### Store
Surface packs, coin packs, remove ads, and starter offers.

### Post-Match Rewards
Surface coins earned, optional double-via-ad, and progression.

### Daily Reward
Simple reward claim surface.

## Data Flow Example
1. user finishes match
2. EconomyService calculates coin award
3. optional rewarded ad doubles award
4. Inventory/Economy state updated locally
5. remote sync occurs once reward claim is finalized

## Data Flow For Pack Open
1. user selects pack
2. EconomyService validates cost
3. PackService resolves reward
4. reward persisted
5. reveal animation plays
6. duplicate check runs
7. duplicate converts to coins if necessary
8. final inventory sync persists result
