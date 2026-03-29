import { useState } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { PACK_CATALOG } from '@/systems/packCatalog'
import { getAvatarRarity } from '@/systems/avatarRarity'
import { RARITY_CONFIG } from '@/types/monetization'
import { COLORS } from '@/core/constants'
import { audioManager } from '@/core/AudioManager'
import type { PackType } from '@/types/monetization'

type Phase = 'selection' | 'revealing' | 'summary'

const FLIP_KEYFRAMES = `
@keyframes cardReveal {
  0%   { transform: scale(0.6) rotateY(180deg); opacity: 0; }
  50%  { transform: scale(1.1) rotateY(90deg); opacity: 0.7; }
  100% { transform: scale(1) rotateY(0deg); opacity: 1; }
}
`

interface PackOpenScreenProps {
  onClose: () => void
}

export function PackOpenScreen({ onClose }: PackOpenScreenProps) {
  const [phase, setPhase] = useState<Phase>('selection')
  const [error, setError] = useState<string | null>(null)
  const [_revealedCards, setRevealedCards] = useState<number[]>([])
  const [currentRevealId, setCurrentRevealId] = useState<number | null>(null)
  const [animKey, setAnimKey] = useState(0)

  const profile = usePlayerStore((s) => s.getActiveProfile())
  const coins = profile?.coins ?? 0

  const isPackOpening = useInventoryStore((s) => s.isPackOpening)
  const pendingRewards = useInventoryStore((s) => s.pendingRewards)
  const revealedCount = useInventoryStore((s) => s.revealedCount)
  const duplicateIds = useInventoryStore((s) => s.duplicateIds)
  const coinsFromDuplicates = useInventoryStore((s) => s.coinsFromDuplicates)
  const openPack = useInventoryStore((s) => s.openPack)
  const revealNext = useInventoryStore((s) => s.revealNext)
  const resetPackState = useInventoryStore((s) => s.resetPackState)

  const allRevealed = isPackOpening && revealedCount >= pendingRewards.length

  const handleOpenPack = (packType: PackType) => {
    audioManager.play('click')
    setError(null)
    const result = openPack(packType)
    if (result.success) {
      setPhase('revealing')
      setRevealedCards([])
      setCurrentRevealId(null)
    } else {
      setError(result.error ?? 'Failed to open pack')
    }
  }

  const handleRevealNext = () => {
    audioManager.play('click')
    const id = revealNext()
    if (id !== null) {
      setCurrentRevealId(id)
      setAnimKey((k) => k + 1)
      setRevealedCards((prev) => [...prev, id])
    }
    // Check if this was the last card
    if (revealedCount + 1 >= pendingRewards.length) {
      // Small delay then show summary
      setTimeout(() => setPhase('summary'), 800)
    }
  }

  const handleOpenAnother = () => {
    resetPackState()
    setPhase('selection')
    setRevealedCards([])
    setCurrentRevealId(null)
    setError(null)
  }

  const handleDone = () => {
    resetPackState()
    onClose()
  }

  return (
    <>
      <style>{FLIP_KEYFRAMES}</style>
      <div
        role="dialog"
        aria-label="Open packs"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 100,
          pointerEvents: 'auto',
          padding: 'calc(var(--safe-top, 20px) + 1rem) 1rem calc(var(--safe-bottom, 20px) + 1rem)',
          overflow: 'auto',
        }}
      >
        {/* Coin balance */}
        <div style={{
          position: 'absolute',
          top: 'calc(var(--safe-top, 20px) + 0.8rem)',
          right: '1.2rem',
          fontSize: '1rem',
          fontWeight: 600,
          color: COLORS.accent,
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}>
          <span style={{ fontSize: '1.2rem' }}>&#x1FA99;</span>
          {coins}
        </div>

        {/* Close button */}
        {phase === 'selection' && (
          <button
            onClick={() => { audioManager.play('click'); onClose() }}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 'calc(var(--safe-top, 20px) + 0.8rem)',
              left: '1.2rem',
              fontSize: '1.5rem',
              background: 'none',
              border: 'none',
              color: COLORS.white,
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            &#x2715;
          </button>
        )}

        {/* ---------- SELECTION PHASE ---------- */}
        {phase === 'selection' && (
          <>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
              fontWeight: 700,
              marginBottom: '0.5rem',
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
            }}>
              Open Packs
            </h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '2rem', textAlign: 'center' }}>
              Choose a pack to open
            </p>

            {error && (
              <div style={{
                color: COLORS.danger,
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '1rem',
                textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '1.2rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: '500px',
            }}>
              {PACK_CATALOG.map((pack) => {
                const canAfford = coins >= pack.price
                return (
                  <div
                    key={pack.type}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '1.5rem 1.2rem',
                      borderRadius: '16px',
                      background: canAfford
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(255,255,255,0.02)',
                      border: `2px solid ${canAfford ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                      opacity: canAfford ? 1 : 0.45,
                      width: '180px',
                      transition: 'transform 0.15s, border-color 0.15s',
                    }}
                  >
                    <span style={{
                      fontSize: '2.5rem',
                      marginBottom: '0.6rem',
                    }}>
                      {pack.type === 'basic' ? '\uD83D\uDCE6' : '\uD83C\uDF1F'}
                    </span>
                    <span style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      marginBottom: '0.3rem',
                      color: COLORS.white,
                    }}>
                      {pack.name}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      opacity: 0.6,
                      textAlign: 'center',
                      marginBottom: '0.5rem',
                      lineHeight: 1.3,
                      color: COLORS.white,
                    }}>
                      {pack.description}
                    </span>
                    <span style={{
                      fontSize: '0.8rem',
                      opacity: 0.5,
                      marginBottom: '0.3rem',
                      color: COLORS.white,
                    }}>
                      {pack.avatarCount} avatar{pack.avatarCount > 1 ? 's' : ''}
                    </span>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: COLORS.accent,
                      marginBottom: '0.8rem',
                    }}>
                      {pack.price} coins
                    </span>
                    <button
                      onClick={() => handleOpenPack(pack.type)}
                      disabled={!canAfford}
                      style={{
                        padding: '0.6rem 1.8rem',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        borderRadius: '12px',
                        background: canAfford
                          ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`
                          : 'rgba(255,255,255,0.08)',
                        color: canAfford ? COLORS.dark : 'rgba(255,255,255,0.3)',
                        border: 'none',
                        cursor: canAfford ? 'pointer' : 'default',
                        minHeight: '44px',
                        transition: 'transform 0.15s',
                      }}
                      onPointerDown={(e) => {
                        if (canAfford) (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'
                      }}
                      onPointerUp={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                      }}
                      onPointerLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                      }}
                    >
                      Open
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ---------- REVEALING PHASE ---------- */}
        {phase === 'revealing' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
          }}>
            {currentRevealId !== null ? (
              <RevealCard
                key={animKey}
                avatarId={currentRevealId}
                isDuplicate={duplicateIds.includes(currentRevealId)}
              />
            ) : (
              <div style={{
                width: '200px',
                height: '260px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.06)',
                border: '2px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
              }}>
                ?
              </div>
            )}

            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>
              {revealedCount} / {pendingRewards.length} revealed
            </div>

            {!allRevealed && (
              <button
                onClick={handleRevealNext}
                style={{
                  padding: '0.8rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                  color: COLORS.dark,
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'
                }}
                onPointerUp={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                }}
                onPointerLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                }}
              >
                Tap to Reveal
              </button>
            )}
          </div>
        )}

        {/* ---------- SUMMARY PHASE ---------- */}
        {phase === 'summary' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '400px',
            width: '100%',
          }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem',
            }}>
              Pack Opened!
            </h2>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.8rem',
              justifyContent: 'center',
              marginBottom: '0.5rem',
            }}>
              {pendingRewards.map((id, i) => {
                const rarity = getAvatarRarity(id)
                const config = RARITY_CONFIG[rarity]
                const isDupe = duplicateIds.includes(id)
                return (
                  <div key={`${id}-${i}`} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.6rem',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `2px solid ${config.color}`,
                    boxShadow: `0 0 12px ${config.color}40`,
                    width: '100px',
                  }}>
                    <img
                      src={`/skins/avatars/${id}.png`}
                      alt={`Avatar #${id}`}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        imageRendering: 'pixelated',
                        marginBottom: '0.3rem',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.white }}>
                      #{id}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: config.color,
                      textTransform: 'uppercase',
                    }}>
                      {config.label}
                    </span>
                    {isDupe && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: COLORS.gold,
                        marginTop: '0.2rem',
                      }}>
                        +{config.coinValue} coins
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {coinsFromDuplicates > 0 && (
              <div style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: COLORS.gold,
              }}>
                +{coinsFromDuplicates} coins from duplicates
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: '1rem',
            }}>
              <button
                onClick={handleOpenAnother}
                style={{
                  padding: '0.8rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                  color: COLORS.dark,
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'
                }}
                onPointerUp={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                }}
                onPointerLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                }}
              >
                Open Another
              </button>
              <button
                onClick={handleDone}
                style={{
                  padding: '0.8rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  color: COLORS.white,
                  border: '2px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/* ---- Reveal card sub-component ---- */

function RevealCard({ avatarId, isDuplicate }: { avatarId: number; isDuplicate: boolean }) {
  const rarity = getAvatarRarity(avatarId)
  const config = RARITY_CONFIG[rarity]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1.5rem 1.2rem',
      borderRadius: '16px',
      background: 'rgba(255,255,255,0.06)',
      border: `3px solid ${config.color}`,
      boxShadow: `0 0 24px ${config.color}50, 0 0 48px ${config.color}20`,
      width: '200px',
      animation: 'cardReveal 0.5s ease-out forwards',
    }}>
      <img
        src={`/skins/avatars/${avatarId}.png`}
        alt={`Avatar #${avatarId}`}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '10px',
          imageRendering: 'pixelated',
          marginBottom: '0.8rem',
        }}
      />
      <span style={{
        fontSize: '1.1rem',
        fontWeight: 700,
        color: COLORS.white,
        marginBottom: '0.3rem',
      }}>
        Avatar #{avatarId}
      </span>
      <span style={{
        fontSize: '0.8rem',
        fontWeight: 700,
        color: config.color,
        textTransform: 'uppercase',
        padding: '0.2rem 0.8rem',
        borderRadius: '20px',
        background: `${config.color}20`,
        marginBottom: isDuplicate ? '0.5rem' : 0,
      }}>
        {config.label}
      </span>
      {isDuplicate && (
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: COLORS.gold,
        }}>
          +{config.coinValue} coins
        </span>
      )}
    </div>
  )
}
