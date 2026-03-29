# Performance Architecture

## Avatar Loading
- Do NOT load all avatars at once
- Use lazy loading
- Load visible items only
- Cache recent assets

## Data Storage
### Local
- Selected avatar
- Cached thumbnails
- UI state

### Firebase
- Owned avatars
- Levels
- Purchases
- rewards

## Sync Strategy
Only sync on:
- Pack open
- Purchase
- Match end
- Reward claim

## Services
- AvatarService
- EconomyService
- AdService
- PurchaseService
- InventoryService

## Key Rule
Keep systems modular and separate
