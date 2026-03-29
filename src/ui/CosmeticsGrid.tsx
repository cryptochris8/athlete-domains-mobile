import { useState } from 'react'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { getCosmeticsBySlot } from '@/systems/cosmeticsCatalog'
import { RARITY_CONFIG } from '@/types/monetization'
import { COLORS } from '@/core/constants'
import { audioManager } from '@/core/AudioManager'

interface CosmeticsGridProps {
  slot: 'shirt' | 'shoes'
}

export function CosmeticsGrid({ slot }: CosmeticsGridProps) {
  const profile = usePlayerStore((s) => s.getActiveProfile())
  const spendCoins = usePlayerStore((s) => s.spendCoins)
  const updateProfile = usePlayerStore((s) => s.updateProfile)
  const equipCosmetic = usePlayerStore((s) => s.equipCosmetic)

  const [buyError, setBuyError] = useState<string | null>(null)

  const items = getCosmeticsBySlot(slot)
  const ownedIds = profile?.ownedCosmeticIds ?? []
  const equippedId = slot === 'shirt' ? profile?.equippedShirt : profile?.equippedShoes
  const coins = profile?.coins ?? 0

  const handleBuy = (itemId: string, price: number) => {
    if (!profile) return
    if (coins < price) {
      setBuyError('Not enough coins!')
      setTimeout(() => setBuyError(null), 2000)
      return
    }
    const success = spendCoins(price)
    if (!success) return
    audioManager.play('grab')
    // Add to owned cosmetics
    const updated = [...ownedIds, itemId]
    updateProfile(profile.id, { ownedCosmeticIds: updated })
  }

  const handleEquip = (itemId: string) => {
    audioManager.play('switchFlip')
    equipCosmetic(slot, itemId)
  }

  return (
    <div>
      {buyError && (
        <div style={{
          textAlign: 'center',
          color: COLORS.danger,
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '0.75rem',
          padding: '0.4rem',
          background: 'rgba(231,76,60,0.15)',
          borderRadius: '8px',
        }}>
          {buyError}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '0.8rem',
      }}>
        {items.map((item) => {
          const owned = ownedIds.includes(item.id)
          const equipped = equippedId === item.id
          const canAfford = coins >= item.price
          const rarityConf = RARITY_CONFIG[item.rarity]

          return (
            <div
              key={item.id}
              style={{
                background: equipped
                  ? `${COLORS.primary}30`
                  : 'rgba(255,255,255,0.05)',
                borderRadius: '14px',
                padding: '1rem',
                border: equipped
                  ? `2px solid ${COLORS.primary}`
                  : '2px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {/* Color preview circle */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: item.color,
                boxShadow: `0 0 14px ${item.color}60`,
                border: '2px solid rgba(255,255,255,0.15)',
              }} />

              {/* Name */}
              <div style={{
                fontWeight: 600,
                fontSize: '0.9rem',
                color: COLORS.white,
                textAlign: 'center',
              }}>
                {item.name}
              </div>

              {/* Rarity badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: rarityConf.color,
                  boxShadow: `0 0 6px ${rarityConf.color}80`,
                }} />
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: rarityConf.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}>
                  {rarityConf.label}
                </span>
              </div>

              {/* Action button */}
              {owned ? (
                equipped ? (
                  <div style={{
                    padding: '0.3rem 1rem',
                    borderRadius: '8px',
                    background: COLORS.primary,
                    color: COLORS.dark,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    Equipped
                  </div>
                ) : (
                  <button
                    onClick={() => handleEquip(item.id)}
                    style={{
                      padding: '0.3rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.15)',
                      color: COLORS.white,
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      border: 'none',
                      cursor: 'pointer',
                      minHeight: '32px',
                      minWidth: '44px',
                    }}
                  >
                    Equip
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleBuy(item.id, item.price)}
                  disabled={!canAfford}
                  style={{
                    padding: '0.3rem 1rem',
                    borderRadius: '8px',
                    background: canAfford ? COLORS.accent : 'rgba(255,255,255,0.05)',
                    color: canAfford ? COLORS.dark : '#666',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    border: 'none',
                    cursor: canAfford ? 'pointer' : 'default',
                    opacity: canAfford ? 1 : 0.5,
                    minHeight: '32px',
                    minWidth: '44px',
                  }}
                >
                  {item.price} coins
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
