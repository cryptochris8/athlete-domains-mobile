import { useState, useEffect } from 'react'
import { useDailyRewardStore } from '@/stores/useDailyRewardStore'
import { DAILY_REWARDS } from '@/systems/dailyRewardSchedule'
import { showRewardedAd, prepareRewardedAd } from '@/services/adService'
import { COLORS } from '@/core/constants'
import { audioManager } from '@/core/AudioManager'

interface DailyRewardModalProps {
  onClose: () => void
}

export function DailyRewardModal({ onClose }: DailyRewardModalProps) {
  const [claimed, setClaimed] = useState(false)
  const [claimedAmount, setClaimedAmount] = useState(0)
  const [adLoading, setAdLoading] = useState(false)

  const canClaim = useDailyRewardStore((s) => s.canClaim())
  const todayReward = useDailyRewardStore((s) => s.getTodayReward())
  const claimDailyReward = useDailyRewardStore((s) => s.claimDailyReward)

  // Which day in the 7-day cycle is "today"
  const todayDay = todayReward.day

  // Prepare a rewarded ad when modal opens
  useEffect(() => {
    prepareRewardedAd('boost_daily')
  }, [])

  // Auto-close after claiming
  useEffect(() => {
    if (!claimed) return
    const timer = setTimeout(onClose, 2000)
    return () => clearTimeout(timer)
  }, [claimed, onClose])

  const handleClaim = (doubled: boolean) => {
    audioManager.play('click')
    const coins = claimDailyReward(doubled)
    setClaimedAmount(coins)
    setClaimed(true)
  }

  const handleWatchAd = async () => {
    setAdLoading(true)
    audioManager.play('click')
    const rewarded = await showRewardedAd()
    setAdLoading(false)
    if (rewarded) {
      handleClaim(true)
    }
  }

  // If reward was already claimed today, don't show
  if (!canClaim && !claimed) {
    onClose()
    return null
  }

  return (
    <div
      role="dialog"
      aria-label="Daily reward"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        pointerEvents: 'auto',
        padding: '1rem',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1.5rem',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
        border: '2px solid rgba(255,255,255,0.1)',
        maxWidth: '380px',
        width: '100%',
        position: 'relative',
      }}>
        {/* Close button */}
        {!claimed && (
          <button
            onClick={() => { audioManager.play('click'); onClose() }}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '0.8rem',
              right: '0.8rem',
              fontSize: '1.3rem',
              background: 'none',
              border: 'none',
              color: COLORS.white,
              opacity: 0.5,
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

        {/* Streak header */}
        <h2 style={{
          fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
          fontWeight: 700,
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.3rem',
          textAlign: 'center',
        }}>
          Daily Reward
        </h2>
        <div style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: COLORS.accent,
          marginBottom: '1.5rem',
        }}>
          Day {todayDay} Streak!
        </div>

        {/* Claimed animation */}
        {claimed ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <div style={{
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              fontWeight: 700,
              color: COLORS.accent,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              +{claimedAmount} Coins!
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '0.5rem' }}>
              Closing automatically...
            </div>
          </div>
        ) : (
          <>
            {/* 7-day calendar row */}
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              marginBottom: '1.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              {DAILY_REWARDS.map((reward) => {
                const isPast = reward.day < todayDay
                const isToday = reward.day === todayDay
                const isFuture = reward.day > todayDay

                return (
                  <div
                    key={reward.day}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: isToday ? '50px' : '40px',
                      height: isToday ? '60px' : '50px',
                      borderRadius: '12px',
                      background: isPast
                        ? `${COLORS.success}30`
                        : isToday
                          ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`
                          : 'rgba(255,255,255,0.04)',
                      border: isToday
                        ? `2px solid ${COLORS.accent}`
                        : isPast
                          ? `2px solid ${COLORS.success}60`
                          : '2px solid rgba(255,255,255,0.06)',
                      opacity: isFuture ? 0.35 : 1,
                      transition: 'transform 0.3s',
                      animation: isToday ? 'pulse 2s ease-in-out infinite' : undefined,
                    }}
                  >
                    <span style={{
                      fontSize: isToday ? '0.65rem' : '0.55rem',
                      opacity: 0.7,
                      fontWeight: 600,
                      color: isToday ? COLORS.dark : COLORS.white,
                    }}>
                      D{reward.day}
                    </span>
                    {isPast ? (
                      <span style={{ fontSize: '1rem', color: COLORS.success }}>&#x2713;</span>
                    ) : (
                      <span style={{
                        fontSize: isToday ? '0.85rem' : '0.7rem',
                        fontWeight: 700,
                        color: isToday ? COLORS.dark : COLORS.white,
                      }}>
                        {reward.coins}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Claim buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.8rem',
              width: '100%',
            }}>
              <button
                onClick={() => handleClaim(false)}
                style={{
                  padding: '0.8rem 2rem',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                  color: COLORS.dark,
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: '44px',
                  width: '100%',
                  maxWidth: '280px',
                  transition: 'transform 0.15s',
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
                Claim {todayReward.coins} Coins
              </button>

              <button
                onClick={handleWatchAd}
                disabled={adLoading}
                style={{
                  padding: '0.7rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.08)',
                  color: COLORS.accent,
                  border: `2px solid ${COLORS.accent}40`,
                  cursor: adLoading ? 'default' : 'pointer',
                  minHeight: '44px',
                  width: '100%',
                  maxWidth: '280px',
                  opacity: adLoading ? 0.5 : 1,
                  transition: 'transform 0.15s',
                }}
                onPointerDown={(e) => {
                  if (!adLoading) (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'
                }}
                onPointerUp={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                }}
                onPointerLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                }}
              >
                {adLoading
                  ? 'Loading ad...'
                  : `Watch Ad to Double (${todayReward.coins + todayReward.bonusCoins} coins)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
