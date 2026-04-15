# Claude Code Implementation Tasks

## Objective
Implement the Athlete Domains V1 system as a lightweight, modular, cosmetic-first architecture inside the existing mobile ecosystem.

## Phase A - Foundation
### Task A1
Create starter avatar ownership defaults.

Acceptance:
- new users receive starter avatars automatically
- starter avatars are persisted as owned
- starter loadout is usable immediately

### Task A2
Create AvatarDefinition and PlayerInventory models.

Acceptance:
- models are centralized
- rarity is supported as metadata
- founder badge field exists but is optional

### Task A3
Implement AvatarService and InventoryService.

Acceptance:
- owned avatars can be listed
- active avatar can be selected
- shirt and shoes can be equipped
- state persists between sessions

## Phase B - Locker Room
### Task B1
Build Locker Room screen.

Acceptance:
- shows owned avatars
- shows locked avatars in preview state if desired
- shows rarity labels
- supports avatar selection
- supports shirt and shoes equip flow

### Task B2
Optimize avatar inventory rendering.

Acceptance:
- lazy loading is used
- large inventory does not cause performance issues
- scrolling remains smooth

## Phase C - Economy
### Task C1
Implement EconomyService.

Acceptance:
- coin balance tracked
- match rewards tracked
- win bonus supported
- daily reward supported
- duplicate conversion supported

### Task C2
Implement pack definitions and pack opening logic.

Acceptance:
- Basic Pack supported
- Pro Pack supported
- optional Elite and Legendary Packs supported behind config
- reward resolved before animation
- duplicate conversion works reliably

## Phase D - Monetization
### Task D1
Implement rewarded ads.

Acceptance:
- double coins option works
- free pack ad flow optional
- rewards validated before grant

### Task D2
Implement purchases.

Acceptance:
- remove ads purchase
- coin pack purchases
- optional starter pack purchase
- restore purchases works

## Phase E - Founder Layer
### Task E1
Add optional founder badge support.

Acceptance:
- founder badge can be toggled per player profile
- founder badge displays in locker room/profile only
- no gameplay power tied to founder badge

### Task E2
Keep NFT logic fully out of core iOS unlock path.

Acceptance:
- no wallet requirement inside the app
- no NFT-dependent item unlock path
- app remains fully functional without blockchain state

## Phase F - QA / Review Readiness
### Task F1
Review for App Store safety.

Acceptance:
- no external purchase bypass language
- no NFT unlock language in app copy
- all monetization routes use iOS-safe flows

### Task F2
Review performance.

Acceptance:
- no full inventory bulk load
- sync only on major events
- low-memory usage acceptable

## Ship Criteria
V1 is ready when:
- starter avatars work
- locker room works
- cosmetics persist
- pack opening works
- duplicate conversion works
- rewarded ads work
- purchases work
- founder badge is cosmetic-only
