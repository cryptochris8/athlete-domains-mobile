import { useGameStore } from '@/stores/useGameStore'
import { useScoreStore } from '@/stores/useScoreStore'
import { audioManager } from '@/core/AudioManager'
import { COLORS } from '@/core/constants'
import type { Scene } from '@/types'

interface GameCard {
  scene: Scene
  name: string
  icon: string
  color: string
  description: string
}

const GAMES: GameCard[] = [
  { scene: 'basketball', name: 'Basketball', icon: '\uD83C\uDFC0', color: '#FF6B35', description: 'Free throw challenge' },
  { scene: 'soccer', name: 'Soccer PK', icon: '\u26BD', color: '#4CAF50', description: 'Penalty kicks' },
  { scene: 'bowling', name: 'Bowling', icon: '\uD83C\uDFB3', color: '#2196F3', description: '10-frame bowling' },
  { scene: 'minigolf', name: 'Mini Golf', icon: '\u26F3', color: '#9C27B0', description: '9-hole course' },
  { scene: 'archery', name: 'Archery', icon: '\uD83C\uDFF9', color: '#E74C3C', description: 'Target range' },
  { scene: 'football', name: 'Football', icon: '\uD83C\uDFC8', color: '#FF9800', description: 'QB throwing' },
  { scene: 'soccer-match', name: 'Soccer Match', icon: '\uD83C\uDFC6', color: '#FFD700', description: 'Full 6v6 match' },
]

export function GameSelectionMenu() {
  const setScene = useGameStore((s) => s.setScene)
  const setSelectedDifficulty = useGameStore((s) => s.setSelectedDifficulty)
  const selectedDifficulty = useGameStore((s) => s.selectedDifficulty)
  const getHighScore = useScoreStore((s) => s.getHighScore)
  const getBestStars = useScoreStore((s) => s.getBestStars)

  const handleGameSelect = (scene: Scene) => {
    audioManager.play('click')
    setScene(scene)
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'auto',
      padding: 'calc(var(--safe-top, 20px) + 1rem) 1rem calc(var(--safe-bottom, 20px) + 1rem)',
    }}>
      {/* Header */}
      <h1 style={{
        fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
        fontWeight: 700,
        marginBottom: '0.5rem',
        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textAlign: 'center',
      }}>
        Athlete Domains
      </h1>
      <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '1.5rem' }}>
        Choose your game
      </p>

      {/* Difficulty selector */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
      }}>
        {(['easy', 'medium', 'hard'] as const).map((d) => (
          <button
            key={d}
            onClick={() => { audioManager.play('switchFlip'); setSelectedDifficulty(d) }}
            style={{
              padding: '0.5rem 1.2rem',
              fontSize: '0.85rem',
              fontWeight: selectedDifficulty === d ? 700 : 400,
              borderRadius: '20px',
              background: selectedDifficulty === d
                ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`
                : 'rgba(255,255,255,0.08)',
              color: selectedDifficulty === d ? COLORS.dark : COLORS.white,
              border: 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
              minHeight: '44px',
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Game grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '1rem',
        width: '100%',
        maxWidth: '600px',
      }}>
        {GAMES.map((game) => {
          const highScore = getHighScore(game.scene)
          const bestStars = getBestStars(game.scene)
          return (
            <button
              key={game.scene}
              onClick={() => handleGameSelect(game.scene)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1rem 0.5rem',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.06)',
                border: '2px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                color: COLORS.white,
                minHeight: '44px',
                transition: 'transform 0.15s, border-color 0.15s',
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
              <span style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>{game.icon}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.2rem' }}>{game.name}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.5rem' }}>{game.description}</span>
              {bestStars > 0 && (
                <div style={{ fontSize: '0.9rem' }}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <span key={i} style={{ color: i < bestStars ? '#FFD700' : 'rgba(255,255,255,0.2)' }}>
                      {i < bestStars ? '\u2605' : '\u2606'}
                    </span>
                  ))}
                </div>
              )}
              {highScore > 0 && (
                <span style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.2rem' }}>
                  Best: {highScore}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
