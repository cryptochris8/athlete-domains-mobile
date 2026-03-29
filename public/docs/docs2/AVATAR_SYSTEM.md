# Avatar System

## Overview
Avatars are the core collectible system.

## Rarity Tiers
- Common (White)
- Rare (Blue)
- Epic (Purple)
- Legendary (Gold)

## Stat Multipliers
- Common: 1.0x
- Rare: 1.1x
- Epic: 1.25x
- Legendary: 1.5x

## Avatar Data Model
- id
- sport
- rarity
- ownedCount
- level
- statModifiers
- thumbnailUrl
- assetUrl

## Duplicate System
IF NOT max level:
- Duplicate used for upgrade

IF MAX level:
- Convert to coins

## Upgrade Requirements
Level 1 → 2:
- 2 total copies
- +5%

Level 2 → 3:
- 5 total copies
- +10%

Level 3 → 4:
- 10 total copies
- +15%
