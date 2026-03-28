import { useSoccerSetupStore } from '@/stores/useSoccerSetupStore'
import { audioManager } from '@/core/AudioManager'

export function SoccerSetupPanel({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const playerCount = useSoccerSetupStore((s) => s.playerCount)
  const player1Team = useSoccerSetupStore((s) => s.player1Team)
  const setPlayerCount = useSoccerSetupStore((s) => s.setPlayerCount)
  const setPlayer1Team = useSoccerSetupStore((s) => s.setPlayer1Team)

  const toggleBtnStyle = (active: boolean, color: string) => ({
    padding: '0.8rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 700 as const,
    borderRadius: '14px',
    border: `3px solid ${active ? color : 'rgba(255,255,255,0.2)'}`,
    background: active ? `${color}33` : 'rgba(255,255,255,0.05)',
    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
    cursor: 'pointer' as const,
    backdropFilter: 'blur(5px)',
    transition: 'all 0.2s ease',
    minWidth: '120px',
  })

  return (
    <>
      <p style={{
        fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
        color: 'rgba(255,255,255,0.85)',
        marginBottom: '2rem',
        fontWeight: 500,
        letterSpacing: '3px',
        textTransform: 'uppercase',
      }}>
        Match Setup
      </p>

      {/* Player Count */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Players
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            aria-label="1 Player"
            onClick={() => { audioManager.play('switchFlip'); setPlayerCount(1) }}
            style={toggleBtnStyle(playerCount === 1, '#4ECDC4')}
          >
            1 Player
          </button>
          <button
            aria-label="2 Players"
            onClick={() => { audioManager.play('switchFlip'); setPlayerCount(2) }}
            style={toggleBtnStyle(playerCount === 2, '#4ECDC4')}
          >
            2 Players
          </button>
        </div>
      </div>

      {/* Team Selection */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
          {playerCount === 1 ? 'Your Team' : 'Player 1 Team'}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <button
            aria-label="Blue Team (Home)"
            onClick={() => { audioManager.play('switchFlip'); setPlayer1Team('home') }}
            style={{
              ...toggleBtnStyle(player1Team === 'home', '#2196F3'),
              padding: '1.2rem 2rem',
              minWidth: '140px',
            }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>🔵</div>
            Blue Team
          </button>
          <button
            aria-label="Red Team (Away)"
            onClick={() => { audioManager.play('switchFlip'); setPlayer1Team('away') }}
            style={{
              ...toggleBtnStyle(player1Team === 'away', '#E74C3C'),
              padding: '1.2rem 2rem',
              minWidth: '140px',
            }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>🔴</div>
            Red Team
          </button>
        </div>
      </div>

      {/* 2P info */}
      {playerCount === 2 && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '0.8rem 1.5rem',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '12px',
          fontSize: '0.8rem',
          opacity: 0.7,
          textAlign: 'center',
          maxWidth: '360px',
        }}>
          P1: WASD + Mouse | P2: Arrows + Numpad
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={onBack}
          aria-label="Back"
          style={{
            padding: '0.8rem 2rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            borderRadius: '12px',
            border: '2px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            backdropFilter: 'blur(5px)',
          }}
        >
          ← Back
        </button>
        <button
          onClick={() => { audioManager.play('click'); onContinue() }}
          aria-label="Continue to avatar selection"
          style={{
            padding: '0.8rem 2.5rem',
            fontSize: '1.1rem',
            fontWeight: 700,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4CAF50, #2196F3)',
            color: '#fff',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 6px 24px rgba(76,175,80,0.4)',
            letterSpacing: '1px',
          }}
        >
          Continue
        </button>
      </div>
    </>
  )
}
