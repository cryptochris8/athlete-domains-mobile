# Athlete Domains Claude Implementation Pack

## Purpose
This pack is designed for Claude Code to wire Athlete Domains into the existing iOS/mobile game ecosystem as a safe V1 launch system.

It combines:
- the V1 cosmetic-first blueprint
- the existing avatar / locker room / monetization docs
- a safe NFT bridge for future Hytopia utility
- an execution order that avoids overbuilding

## Core Product Decision
V1 should be:
- cosmetic-first
- App Store friendly
- low complexity
- modular
- performant
- expandable later

## Important Decision On Stats
Earlier docs included rarity stat multipliers and avatar upgrades.
For V1 launch, DO NOT make rarity or NFT ownership provide gameplay power.

For launch:
- rarity should mainly drive presentation, desirability, and pack value
- duplicates should convert to coins
- no pay-to-win advantage from paid content

Stat-based progression can be revisited in V2 after retention and balancing data exist.

## What Claude Should Build First
1. starter avatars
2. locker room
3. cosmetics (shirt + shoes only)
4. player inventory persistence
5. coin economy
6. pack opening
7. duplicate-to-coin conversion
8. rewarded ads
9. purchases
10. optional founder / OG badge layer

## What Claude Should NOT Build In V1
- battle pass
- live rotating shop
- deep upgrade trees
- rarity power advantages
- complex social trading
- NFT wallet logic inside the iOS app
- blockchain-dependent unlock flow inside the app

## File Guide
- 01_PRODUCT_RULES.md -> source of truth for business and compliance logic
- 02_SYSTEM_ARCHITECTURE.md -> services, data flow, storage, sync model
- 03_DATA_MODELS.md -> recommended models and fields
- 04_NFT_BRIDGE_STRATEGY.md -> safe connection between NFT collection and iOS app
- 05_FOUNDER_DROPS_AND_REWARDS.md -> Discord / OG community rollout system
- 06_IMPLEMENTATION_TASKS.md -> build order and acceptance checklist
- 07_CONFIG_EXAMPLE.json -> starter values and economy settings

## Final Direction
Treat Athlete Domains as:
- NFT collection for future Hytopia / cross-platform identity
- cosmetic-first mobile avatar ecosystem today

The app must be fully fun, monetizable, and usable without NFT ownership.
