import type { PackDefinition } from '@/types/monetization'

export const PACK_CATALOG: PackDefinition[] = [
  {
    type: 'basic',
    name: 'Basic Pack',
    price: 500,
    avatarCount: 1,
    description: 'Contains 1 random avatar',
  },
  {
    type: 'pro',
    name: 'Pro Pack',
    price: 1500,
    avatarCount: 3,
    description: 'Contains 3 avatars (1 Rare+ guaranteed)',
    guaranteedMinRarity: 'rare',
  },
  {
    type: 'elite',
    name: 'Elite Pack',
    price: 0,
    avatarCount: 5,
    description: 'Contains 5 avatars (1 Epic+ guaranteed)',
    guaranteedMinRarity: 'epic',
  },
  {
    type: 'legendary',
    name: 'Legendary Pack',
    price: 0,
    avatarCount: 3,
    description: '1 Legendary + 2 additional avatars',
    guaranteedMinRarity: 'legendary',
  },
]

export function getPackByType(type: string): PackDefinition | undefined {
  return PACK_CATALOG.find((p) => p.type === type)
}
