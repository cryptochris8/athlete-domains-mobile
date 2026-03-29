# Athlete Domains V1 Implementation Blueprint

## Goal
Build the smoothest and simplest version of the Athlete Domains mobile app monetization and customization system for launch.

This V1 should prioritize:
- smooth performance
- low complexity
- clean modular architecture
- easy App Store submission
- future expandability

---

## Core V1 Strategy

For launch, avatars should be treated primarily as:
- collectible skins
- cosmetic identity
- customization options

Do NOT make the first version heavily dependent on avatar stat boosts or pay-to-win mechanics.

This keeps gameplay simpler, the economy easier to manage, and the app more stable.

---

## What To Build In V1

### 1. Starter Avatars
Each new player automatically owns 3 to 5 generic starter avatars.

Suggested starter set:
- 1 male athlete
- 1 female athlete
- 1 neutral or alternate athlete
- optional 1 to 2 sport-flavored variants

Requirements:
- available immediately at first launch
- selectable with no purchase
- stored as owned by default

---

### 2. Locker Room
Create a Locker Room screen that allows the player to:
- view owned avatars
- select active avatar
- equip owned cosmetics
- preview locked items
- see simple rarity labels

The Locker Room is the central customization hub.

---

### 3. Cosmetics
For V1, support only 2 cosmetic categories:
- shirt / jersey
- shoes

Do not build socks, hats, wristbands, or advanced accessories yet.

Requirements:
- items can be owned or locked
- player can equip one shirt and one pair of shoes
- equipped cosmetics should persist between sessions

---

### 4. Coin Economy
Add a soft currency called coins.

Coins are earned through:
- match completion
- wins
- rewarded ads
- daily reward

Coins are spent on:
- basic packs
- selected cosmetic items

Keep economy values configurable through constants or JSON config.

---

### 5. Packs
For V1, keep packs simple.

Recommended launch packs:
- Basic Pack: 1 avatar
- Pro Pack: 3 avatars

Optional later:
- Elite Pack
- Legendary Pack

Requirements:
- reward is determined before animation
- animation is reveal-only
- results are saved securely before visual presentation

---

### 6. Duplicates
For V1, the simplest system is:

If player receives a duplicate avatar:
- convert duplicate into coins

Do NOT build a full avatar upgrade tree in V1.

Reason:
- simpler logic
- fewer bugs
- easier balancing
- easier database design

This upgrade system can be added in V2.

---

### 7. Monetization
Launch monetization should include:
- rewarded ads
- remove ads purchase
- coin packs
- optional starter pack

Recommended V1 monetization products:
- Remove Ads: one-time purchase
- Small Coin Pack
- Medium Coin Pack
- Starter Offer

Do not launch a battle pass or rotating live shop yet.

---

## Rewarded Ads Use Cases
Use rewarded ads in a few clear places only:
- double coins after a match
- claim free basic pack
- boost daily reward
- retry after a loss if desired

Avoid excessive ad placements.

---

## What NOT To Build In V1
The following should wait until a later version:
- battle pass
- live timed shop rotation
- deep avatar stat boosts
- complex duplicate upgrade trees
- large cosmetic slot expansion
- advanced social economy
- frequent cloud sync loops
- overly cinematic heavy pack animations

---

## Performance Requirements

### Avatar Asset Loading
Do NOT load all avatars into memory at once.

Requirements:
- lazy load avatar thumbnails
- load only visible inventory items
- cache recently used items
- load full asset only when needed

### Inventory UI
Requirements:
- paginate or virtualize large avatar lists
- avoid rendering all owned items at once
- use lightweight metadata objects

### Network / Sync
Only sync on major events:
- purchase completed
- pack opened
- reward claimed
- match ended
- cosmetic equipped if needed

Do not continuously write to Firebase during normal browsing.

---

## Suggested Data Model

### Avatar
- id
- name
- sport
- rarity
- thumbnailUrl
- assetUrl
- owned
- locked

### Cosmetic Item
- id
- category
- name
- rarity
- thumbnailUrl
- owned
- locked

### Player Inventory
- ownedAvatarIds
- ownedCosmeticIds
- selectedAvatarId
- equippedShirtId
- equippedShoesId
- coinBalance
- adsRemoved

---

## Suggested Services

Build the following services separately:

### AvatarService
Responsibilities:
- fetch avatar definitions
- fetch owned avatars
- manage avatar selection

### InventoryService
Responsibilities:
- manage owned items
- manage equipped cosmetics
- persist equipped choices

### EconomyService
Responsibilities:
- award coins
- spend coins
- handle duplicate conversion
- validate pack costs

### AdService
Responsibilities:
- rewarded ad flow
- ad callbacks
- reward validation

### PurchaseService
Responsibilities:
- remove ads purchase
- coin pack purchases
- starter pack purchases
- restore purchases

Keep these services modular and isolated.

---

## Recommended Build Order

### Step 1
Implement starter avatars and player ownership defaults.

### Step 2
Implement Locker Room UI with active avatar selection.

### Step 3
Implement cosmetic system with shirt and shoes only.

### Step 4
Implement coin balance and earning rules.

### Step 5
Implement basic pack opening logic.

### Step 6
Implement duplicate-to-coin conversion.

### Step 7
Implement rewarded ads.

### Step 8
Implement remove ads and coin pack purchases.

### Step 9
Test persistence, syncing, and low-memory performance.

---

## UX Notes
Keep the V1 UX simple:
- easy access to Locker Room
- easy pack purchase flow
- clear ownership states
- clear equipped states
- minimal clutter

The player should always understand:
- what they own
- what is equipped
- what costs coins
- what requires purchase
- what can be unlocked

---

## Future Expansion Path

### V2
- add socks and accessories
- add better pack variety
- add avatar duplicates for upgrades
- add collection progress

### V3
- add events
- add limited-time drops
- add battle pass
- add rarity-based progression systems

---

## Final Instruction For Claude Code
Implement the V1 system as a lightweight, modular, cosmetic-first architecture.

Prioritize:
- performance
- stability
- maintainability
- clean separation of services
- future expandability

Do not overbuild V1.
Build the cleanest possible foundation first.
