import { useScoreStore } from '@/stores/useScoreStore'
import { useGameStore } from '@/stores/useGameStore'
import { audioManager } from '@/core/AudioManager'

interface HUDProps {
  gameName: string
  shotsRemaining?: number
  timeRemaining?: number
}

export function HUD({ gameName, shotsRemaining, timeRemaining }: HUDProps) {
  const currentScore = useScoreStore((s) => s.currentScore)
  const currentStreak = useScoreStore((s) => s.currentStreak)
  const setGamePhase = useGameStore((s) => s.setGamePhase)

  const isOnFire = currentStreak >= 5
  const hasStreakGlow = currentStreak >= 3

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '1rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      pointerEvents: 'none',
      zIndex: 50,
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.6)',
        borderRadius: '12px',
        padding: '0.6rem 1.2rem',
        backdropFilter: 'blur(8px)',
        boxShadow: hasStreakGlow ? '0 0 20px rgba(247, 201, 72, 0.4)' : undefined,
        transition: 'box-shadow 0.3s ease',
      }}>
        <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase' }}>{gameName}</div>
        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{currentScore}</div>
        {currentStreak > 1 && (
          <div style={{
            fontSize: '0.8rem',
            color: isOnFire ? '#FF6B35' : '#F7C948',
            fontWeight: isOnFire ? 700 : 400,
          }}>
            {isOnFire ? 'ON FIRE! ' : ''}Streak x{currentStreak}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {timeRemaining !== undefined && (
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '12px',
            padding: '0.6rem 1rem',
            backdropFilter: 'blur(8px)',
            fontSize: '1.4rem',
            fontWeight: 600,
            color: timeRemaining <= 10 ? '#E74C3C' : '#fff',
            animation: timeRemaining <= 10 ? 'pulse 1s ease-in-out infinite' : undefined,
          }}>
            {formatTime(timeRemaining)}
          </div>
        )}

        {shotsRemaining !== undefined && (
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '12px',
            padding: '0.6rem 1rem',
            backdropFilter: 'blur(8px)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>SHOTS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>{shotsRemaining}</div>
          </div>
        )}

        <button
          onClick={() => { audioManager.play('click'); setGamePhase('paused') }}
          style={{
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '12px',
            padding: '0.6rem 1rem',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: '1.2rem',
            pointerEvents: 'auto',
          }}
        >
          ||
        </button>
      </div>
    </div>
  )
}
