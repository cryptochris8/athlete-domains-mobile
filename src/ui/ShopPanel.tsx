import { useState } from 'react'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useShopStore } from '@/stores/useShopStore'
import { SHOP_CATALOG, type ShopItemCategory } from '@/systems/shopCatalog'
import { audioManager } from '@/core/AudioManager'
import { COLORS } from '@/core/constants'

interface ShopPanelProps {
  onClose: () => void
}

const TABS: { value: ShopItemCategory; label: string }[] = [
  { value: 'ball', label: 'Balls' },
  { value: 'celebration', label: 'Effects' },
  { value: 'theme', label: 'Themes' },
  { value: 'accessory', label: 'Gear' },
]

export function ShopPanel({ onClose }: ShopPanelProps) {
  const [tab, setTab] = useState<ShopItemCategory>('ball')
  const coins = usePlayerStore((s) => s.getActiveProfile())?.coins ?? 0
  const spendCoins = usePlayerStore((s) => s.spendCoins)
  const owns = useShopStore((s) => s.owns)
  const buyItem = useShopStore((s) => s.buyItem)
  const equipItem = useShopStore((s) => s.equipItem)

  const handleBuy = (itemId: string, price: number) => {
    const success = spendCoins(price)
    if (!success) return
    buyItem(itemId)
  }
  const equippedBall = useShopStore((s) => s.equippedBall)
  const equippedCelebration = useShopStore((s) => s.equippedCelebration)
  const equippedTheme = useShopStore((s) => s.equippedTheme)
  const equippedAccessory = useShopStore((s) => s.equippedAccessory)

  const items = SHOP_CATALOG.filter((i) => i.category === tab)

  const getEquipped = (category: ShopItemCategory) => {
    if (category === 'ball') return equippedBall
    if (category === 'celebration') return equippedCelebration
    if (category === 'accessory') return equippedAccessory
    return equippedTheme
  }

  return (
    <div
      role="dialog"
      aria-label="Shop"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 200,
        pointerEvents: 'auto',
      }}
    >
      <div style={{
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        background: COLORS.dark,
        borderRadius: '20px',
        padding: '1.5rem',
        overflow: 'auto',
        border: `2px solid ${COLORS.primary}44`,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Shop
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.accent }}>
              {coins} coins
            </span>
            <button
              onClick={() => { audioManager.play('click'); onClose() }}
              aria-label="Close shop"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                fontSize: '1.2rem',
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '0.3rem 0.8rem',
              }}
            >
              X
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { audioManager.play('switchFlip'); setTab(t.value) }}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '10px',
                background: tab === t.value ? COLORS.primary : 'rgba(255,255,255,0.1)',
                color: tab === t.value ? COLORS.dark : '#aaa',
                fontWeight: tab === t.value ? 700 : 500,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Items grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.8rem',
        }}>
          {items.map((item) => {
            const owned = owns(item.id)
            const equipped = getEquipped(item.category) === item.id
            const canAfford = coins >= item.price

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
                {item.color && (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: item.color,
                    boxShadow: `0 0 12px ${item.color}60`,
                  }} />
                )}
                <div style={{ fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6, textAlign: 'center' }}>
                  {item.description}
                </div>
                {owned ? (
                  <button
                    onClick={() => equipItem(item.id, item.category)}
                    style={{
                      padding: '0.3rem 1rem',
                      borderRadius: '8px',
                      background: equipped ? COLORS.primary : 'rgba(255,255,255,0.15)',
                      color: equipped ? COLORS.dark : '#fff',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {equipped ? 'Equipped' : 'Equip'}
                  </button>
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
    </div>
  )
}
