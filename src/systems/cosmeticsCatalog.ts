import type { CosmeticItem, CosmeticSlot } from '@/types/monetization'

export const COSMETICS_CATALOG: CosmeticItem[] = [
  // Shirts
  { id: 'shirt-red',    name: 'Red Jersey',    slot: 'shirt', price: 20,  rarity: 'common',    color: '#E74C3C', description: 'Classic red jersey' },
  { id: 'shirt-blue',   name: 'Blue Jersey',   slot: 'shirt', price: 20,  rarity: 'common',    color: '#3498DB', description: 'Cool blue jersey' },
  { id: 'shirt-green',  name: 'Green Jersey',  slot: 'shirt', price: 20,  rarity: 'common',    color: '#2ECC71', description: 'Fresh green jersey' },
  { id: 'shirt-gold',   name: 'Gold Jersey',   slot: 'shirt', price: 50,  rarity: 'rare',      color: '#FFD700', description: 'Shining gold jersey' },
  { id: 'shirt-galaxy', name: 'Galaxy Jersey', slot: 'shirt', price: 100, rarity: 'epic',      color: '#6B3FA0', description: 'Cosmic galaxy jersey' },
  { id: 'shirt-legend', name: 'Legend Jersey', slot: 'shirt', price: 200, rarity: 'legendary', color: '#FF6B35', description: 'Legendary champion jersey' },
  // Shoes
  { id: 'shoes-white',  name: 'White Kicks',    slot: 'shoes', price: 15,  rarity: 'common',    color: '#FFFFFF', description: 'Clean white kicks' },
  { id: 'shoes-black',  name: 'Shadow Boots',   slot: 'shoes', price: 15,  rarity: 'common',    color: '#2C2C2C', description: 'Stealthy black boots' },
  { id: 'shoes-blue',   name: 'Ocean Trainers', slot: 'shoes', price: 15,  rarity: 'common',    color: '#1E90FF', description: 'Ocean blue trainers' },
  { id: 'shoes-gold',   name: 'Gold Cleats',    slot: 'shoes', price: 50,  rarity: 'rare',      color: '#FFD700', description: 'Golden cleats' },
  { id: 'shoes-fire',   name: 'Fire Runners',   slot: 'shoes', price: 100, rarity: 'epic',      color: '#FF4500', description: 'Flame-streaked runners' },
  { id: 'shoes-legend', name: 'Legend Boots',   slot: 'shoes', price: 200, rarity: 'legendary', color: '#9B59B6', description: 'Legendary enchanted boots' },
]

export function getCosmeticById(id: string): CosmeticItem | undefined {
  return COSMETICS_CATALOG.find((item) => item.id === id)
}

export function getCosmeticsBySlot(slot: CosmeticSlot): CosmeticItem[] {
  return COSMETICS_CATALOG.filter((item) => item.slot === slot)
}
