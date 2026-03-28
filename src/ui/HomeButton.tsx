import { useGameStore } from '@/stores/useGameStore'
import { audioManager } from '@/core/AudioManager'

export function HomeButton() {
  const returnToMenu = useGameStore((s) => s.returnToMenu)
  const gamePhase = useGameStore((s) => s.gamePhase)

  // Hide during gameover and paused since those screens have their own navigation
  if (gamePhase === 'gameover' || gamePhase === 'paused') return null

  return (
    <button
      onClick={() => { audioManager.play('click'); returnToMenu() }}
      aria-label="Return to main menu"
      title="Main Menu"
      style={{
        position: 'absolute',
        bottom: 'calc(1rem + var(--safe-bottom, 0px))',
        left: 'calc(1rem + var(--safe-left, 0px))',
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        color: '#fff',
        fontSize: '1.3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        zIndex: 80,
        lineHeight: 1,
      }}
    >
      {'\u2302'}
    </button>
  )
}
