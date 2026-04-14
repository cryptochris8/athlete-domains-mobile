/**
 * Calculate coins earned from a game result.
 */
export function calculateMatchCoins(params: {
  stars: number
  isNewHighScore: boolean
  isWin?: boolean
}): number {
  let coins = 0

  // Base coins from stars
  switch (params.stars) {
    case 1: coins = 30; break
    case 2: coins = 50; break
    case 3: coins = 75; break
    default: coins = 10; break
  }

  // Win bonus
  if (params.isWin) {
    coins += 30
  }

  // New high score bonus
  if (params.isNewHighScore) {
    coins += 25
  }

  return coins
}

/**
 * Check if player can afford a price.
 */
export function canAfford(balance: number, price: number): boolean {
  return balance >= price
}
