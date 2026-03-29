import { useState, useEffect, useMemo } from 'react'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { getAvatarRarity } from '@/systems/avatarRarity'
import { RARITY_CONFIG } from '@/types/monetization'
import { COLORS, SPORT_TABS, type AvatarSport } from '@/core/constants'
import { audioManager } from '@/core/AudioManager'
import { CosmeticsGrid } from '@/ui/CosmeticsGrid'
import type { CatalogEntry } from '@/ui/AvatarPicker'

type Tab = 'avatars' | 'shirts' | 'shoes'

const TABS: { value: Tab; label: string }[] = [
  { value: 'avatars', label: 'Avatars' },
  { value: 'shirts', label: 'Shirts' },
  { value: 'shoes', label: 'Shoes' },
]

const ITEMS_PER_PAGE = 24
const GRID_COLS = 6

interface LockerRoomProps {
  onClose: () => void
}

/** Pagination helper */
function paginateCatalog(items: CatalogEntry[], page: number): { pageItems: CatalogEntry[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE))
  const clamped = Math.max(0, Math.min(page, totalPages - 1))
  const start = clamped * ITEMS_PER_PAGE
  return { pageItems: items.slice(start, start + ITEMS_PER_PAGE), totalPages }
}

/** Filter catalog by sport */
function filterBySport(catalog: CatalogEntry[], sport: AvatarSport | 'all'): CatalogEntry[] {
  if (sport === 'all') return catalog
  return catalog.filter((e) => e.sport === sport)
}

export function LockerRoom({ onClose }: LockerRoomProps) {
  const profile = usePlayerStore((s) => s.getActiveProfile())
  const updateProfile = usePlayerStore((s) => s.updateProfile)

  const coins = profile?.coins ?? 0
  const currentSkinId = profile?.skinId ?? 1
  const ownedAvatarIds = profile?.ownedAvatarIds ?? []

  const [tab, setTab] = useState<Tab>('avatars')
  const [catalog, setCatalog] = useState<CatalogEntry[]>([])
  const [sport, setSport] = useState<AvatarSport | 'all'>('all')
  const [page, setPage] = useState(0)
  const [lockedTooltip, setLockedTooltip] = useState<number | null>(null)

  // Load avatar catalog on mount
  useEffect(() => {
    fetch('/avatar-catalog.json')
      .then((r) => r.json())
      .then((data: CatalogEntry[]) => setCatalog(data))
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => filterBySport(catalog, sport), [catalog, sport])
  const { pageItems, totalPages } = useMemo(() => paginateCatalog(filtered, page), [filtered, page])

  // Reset page when sport changes
  useEffect(() => { setPage(0) }, [sport])

  const handleAvatarTap = (avatarId: number) => {
    if (!profile) return
    if (ownedAvatarIds.includes(avatarId)) {
      audioManager.play('grab')
      updateProfile(profile.id, { skinId: avatarId })
    } else {
      // Show locked tooltip
      audioManager.play('click')
      setLockedTooltip(avatarId)
      setTimeout(() => setLockedTooltip(null), 2000)
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Locker Room"
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
        width: '92%',
        maxWidth: '620px',
        maxHeight: '90vh',
        background: COLORS.dark,
        borderRadius: '24px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: `2px solid ${COLORS.primary}44`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Gradient header */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <h2 style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: COLORS.dark,
            margin: 0,
          }}>
            Locker Room
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: COLORS.dark,
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '12px',
              padding: '0.25rem 0.75rem',
            }}>
              {coins} coins
            </span>
            <button
              onClick={() => { audioManager.play('click'); onClose() }}
              aria-label="Close locker room"
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: 'none',
                color: COLORS.dark,
                fontSize: '1.2rem',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '0.3rem 0.8rem',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              X
            </button>
          </div>
        </div>

        {/* Main tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          flexShrink: 0,
          background: 'rgba(0,0,0,0.2)',
        }}>
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { audioManager.play('switchFlip'); setTab(t.value) }}
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: '10px',
                background: tab === t.value ? COLORS.primary : 'rgba(255,255,255,0.1)',
                color: tab === t.value ? COLORS.dark : '#aaa',
                fontWeight: tab === t.value ? 700 : 500,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                minHeight: '44px',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content — scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 1.5rem 1.5rem',
        }}>
          {/* =================== AVATARS TAB =================== */}
          {tab === 'avatars' && (
            <>
              {/* Sport filter tabs */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.35rem',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}>
                {SPORT_TABS.map((st) => {
                  const isActive = sport === st.value
                  return (
                    <button
                      key={st.value}
                      onClick={() => { audioManager.play('switchFlip'); setSport(st.value) }}
                      style={{
                        padding: '0.3rem 0.7rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: isActive ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.15)',
                        background: isActive ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                        color: isActive ? '#FFD700' : 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {st.label}
                    </button>
                  )
                })}
              </div>

              {/* Avatar thumbnail grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                gap: '0.4rem',
                marginBottom: '0.75rem',
                minHeight: '200px',
              }}>
                {pageItems.map((entry) => {
                  const isOwned = ownedAvatarIds.includes(entry.id)
                  const isSelected = entry.id === currentSkinId
                  const rarity = getAvatarRarity(entry.id)
                  const rarityColor = RARITY_CONFIG[rarity].color
                  const showTooltip = lockedTooltip === entry.id

                  return (
                    <div key={entry.id} style={{ position: 'relative' }}>
                      <button
                        aria-label={`${entry.name}${isOwned ? '' : ' (locked)'}`}
                        onClick={() => handleAvatarTap(entry.id)}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '8px',
                          border: isSelected
                            ? '3px solid #FFD700'
                            : `3px solid ${rarityColor}55`,
                          background: isSelected
                            ? 'rgba(255,215,0,0.15)'
                            : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer',
                          padding: 0,
                          overflow: 'hidden',
                          transition: 'transform 0.12s ease, border-color 0.12s ease',
                          transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                          boxShadow: isSelected ? '0 2px 10px rgba(255,215,0,0.3)' : 'none',
                          position: 'relative',
                          minWidth: '44px',
                          minHeight: '44px',
                        }}
                      >
                        <img
                          src={`/skins/avatars/${entry.id}.png`}
                          alt={entry.name}
                          loading="lazy"
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'cover',
                            imageRendering: 'pixelated',
                            display: 'block',
                            margin: '0 auto',
                          }}
                        />

                        {/* Lock overlay for unowned */}
                        {!isOwned && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '5px',
                            fontSize: '1.2rem',
                          }}>
                            <span role="img" aria-label="Locked">
                              🔒
                            </span>
                          </div>
                        )}
                      </button>

                      {/* Locked tooltip */}
                      {showTooltip && !isOwned && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(0,0,0,0.9)',
                          color: COLORS.accent,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap',
                          zIndex: 10,
                          marginBottom: '4px',
                          border: `1px solid ${COLORS.accent}44`,
                        }}>
                          Get from Packs
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}>
                <button
                  onClick={() => { audioManager.play('click'); setPage((p) => Math.max(0, p - 1)) }}
                  disabled={page <= 0}
                  style={{
                    padding: '0.3rem 0.8rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    background: page <= 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
                    color: page <= 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)',
                    cursor: page <= 0 ? 'default' : 'pointer',
                    minHeight: '44px',
                    minWidth: '44px',
                  }}
                >
                  Prev
                </button>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => { audioManager.play('click'); setPage((p) => Math.min(totalPages - 1, p + 1)) }}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: '0.3rem 0.8rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    background: page >= totalPages - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
                    color: page >= totalPages - 1 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)',
                    cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                    minHeight: '44px',
                    minWidth: '44px',
                  }}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* =================== SHIRTS TAB =================== */}
          {tab === 'shirts' && <CosmeticsGrid slot="shirt" />}

          {/* =================== SHOES TAB =================== */}
          {tab === 'shoes' && <CosmeticsGrid slot="shoes" />}
        </div>
      </div>
    </div>
  )
}
