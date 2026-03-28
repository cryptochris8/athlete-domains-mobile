import { useSoccer } from '@/games/soccer/useSoccer'
import { SOCCER_CONFIG } from '@/games/soccer/config'
import { BaseGameOverlay, useOverlayHandlers } from '@/ui/BaseGameOverlay'
import { PowerMeter } from '@/components/PowerMeter'

export function SoccerOverlay() {
  const soccerPhase = useSoccer((s) => s.phase)
  const currentKick = useSoccer((s) => s.currentKick)
  const effectiveTotalKicks = useSoccer((s) => s.effectiveTotalKicks)
  const playerGoals = useSoccer((s) => s.playerGoals)
  const opponentGoals = useSoccer((s) => s.opponentGoals)
  const power = useSoccer((s) => s.power)
  const keeperSlowed = useSoccer((s) => s.keeperSlowed)
  const resetGame = useSoccer((s) => s.resetGame)

  const { handlePlayAgain } = useOverlayHandlers(resetGame)

  return (
    <BaseGameOverlay game="soccer" onPlayAgain={handlePlayAgain}>
      {/* Scoreboard */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        background: 'rgba(0,0,0,0.7)',
        padding: '0.8rem 1.5rem',
        borderRadius: '16px',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none',
        zIndex: 60,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>YOU</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2ECC71' }}>{playerGoals}</div>
        </div>
        <div style={{ fontSize: '0.9rem', opacity: 0.5 }}>
          Kick {currentKick}/{effectiveTotalKicks}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>GK</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#E74C3C' }}>{opponentGoals}</div>
        </div>
      </div>

      {soccerPhase === 'charging' && (
        <PowerMeter
          power={power}
          maxPower={SOCCER_CONFIG.maxKickPower}
          isCharging
        />
      )}

      {keeperSlowed && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #FF6B35, #F7C948)',
          padding: '0.4rem 1.2rem',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#1A1A2E',
          pointerEvents: 'none',
          zIndex: 60,
        }}>
          KEEPER SLOWED!
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '0.85rem',
        opacity: 0.6,
        pointerEvents: 'none',
        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        zIndex: 60,
      }}>
        {soccerPhase === 'aiming' && 'Joystick to aim | Tap Shoot to charge'}
        {soccerPhase === 'charging' && 'Release Shoot to kick!'}
      </div>
    </BaseGameOverlay>
  )
}
