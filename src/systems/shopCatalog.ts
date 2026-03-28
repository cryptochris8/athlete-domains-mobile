export type ShopItemCategory = 'ball' | 'celebration' | 'theme' | 'accessory'

export interface ShopItem {
  id: string
  name: string
  category: ShopItemCategory
  price: number
  color?: string
  description: string
}

export const SHOP_CATALOG: ShopItem[] = [
  // Ball colors (10 coins each)
  { id: 'ball-red', name: 'Red Ball', category: 'ball', price: 10, color: '#E74C3C', description: 'A fiery red ball' },
  { id: 'ball-blue', name: 'Blue Ball', category: 'ball', price: 10, color: '#3498DB', description: 'A cool blue ball' },
  { id: 'ball-gold', name: 'Gold Ball', category: 'ball', price: 10, color: '#FFD700', description: 'A shiny gold ball' },
  { id: 'ball-rainbow', name: 'Rainbow Ball', category: 'ball', price: 10, color: '#FF69B4', description: 'A colorful rainbow ball' },
  { id: 'ball-galaxy', name: 'Galaxy Ball', category: 'ball', price: 10, color: '#6B3FA0', description: 'A deep space purple ball' },

  // Celebrations (15 coins each)
  { id: 'celeb-stars', name: 'Star Burst', category: 'celebration', price: 15, description: 'Star-shaped confetti on scores' },
  { id: 'celeb-fireworks', name: 'Fireworks', category: 'celebration', price: 15, description: 'Fireworks explosion on big scores' },
  { id: 'celeb-sparkle', name: 'Sparkle Trail', category: 'celebration', price: 15, description: 'Sparkle effects trail behind balls' },

  // Themes (25 coins each)
  { id: 'theme-neon', name: 'Neon Glow', category: 'theme', price: 25, color: '#00FF88', description: 'Neon green glow effects' },
  { id: 'theme-sunset', name: 'Sunset', category: 'theme', price: 25, color: '#FF6347', description: 'Warm sunset color scheme' },
  { id: 'theme-ocean', name: 'Ocean', category: 'theme', price: 25, color: '#1E90FF', description: 'Deep ocean blue theme' },
  { id: 'theme-arctic', name: 'Arctic', category: 'theme', price: 25, color: '#A5F2F3', description: 'Cool icy blue theme' },

  // Extra balls
  { id: 'ball-emerald', name: 'Emerald Ball', category: 'ball', price: 10, color: '#50C878', description: 'Brilliant emerald green' },
  { id: 'ball-shadow', name: 'Shadow Ball', category: 'ball', price: 15, color: '#2C2C2C', description: 'Mysterious dark ball' },

  // Extra celebration
  { id: 'celeb-confetti', name: 'Mega Confetti', category: 'celebration', price: 20, description: 'Extra confetti on every score' },

  // Accessories (gear for specific games)
  { id: 'acc-bow-flame', name: 'Flame Bow', category: 'accessory', price: 20, color: '#FF4500', description: 'Fiery bow skin for archery' },
  { id: 'acc-football-gold', name: 'Gold Football', category: 'accessory', price: 20, color: '#FFD700', description: 'Golden football for throws' },
  { id: 'acc-bowling-crystal', name: 'Crystal Ball', category: 'accessory', price: 20, color: '#E0F7FA', description: 'Crystal bowling ball' },
  { id: 'acc-golf-star', name: 'Star Putter', category: 'accessory', price: 15, color: '#FFEB3B', description: 'Star-themed golf putter' },
]

export function getItemById(id: string): ShopItem | undefined {
  return SHOP_CATALOG.find((item) => item.id === id)
}

export function getItemsByCategory(category: ShopItemCategory): ShopItem[] {
  return SHOP_CATALOG.filter((item) => item.category === category)
}
