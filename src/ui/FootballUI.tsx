import { useGameStore } from '@/stores/useGameStore'
import { useMobileStore } from '@/stores/useMobileStore'
import { useFootball } from '@/games/football/useFootball'
import { FOOTBALL_CONFIG } from '@/games/football/config'
import { HUD } from '@/ui/HUD'
import { BaseGameOverlay, useOverlayHandlers } from '@/ui/BaseGameOverlay'
import { Crosshair } from '@/games/football/Crosshair'
import { PowerMeter } from '@/components/PowerMeter'

export function FootballOverlay() {
  const timeRemaining = useFootball((s) => s.timeRemaining)
  const shotsFired = useFootball((s) => s.shotsFired)
  const targetsHit = useFootball((s) => s.targetsHit)
  const interceptions = useFootball((s) => s.interceptions)
  const resetGame = useFootball((s) => s.resetGame)
  const power = useFootball((s) => s.power)
  const isPowerCharging = useFootball((s) => s.isPowerCharging)

  const { handlePlayAgain } = useOverlayHandlers(resetGame)

  const gamePhase = useGameStore((s) => s.gamePhase)
  const isMobile = useMobileStore((s) => s.isMobile)

  return (
    <BaseGameOverlay game="football" onPlayAgain={handlePlayAgain}>
      <HUD
        gameName="Football"
        timeRemaining={timeRemaining}
      />
      {/* Stats panel */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '1rem',
        pointerEvents: 'none',
        zIndex: 50,
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '12px',
          padding: '0.4rem 0.8rem',
          backdropFilter: 'blur(8px)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>THROWS</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{shotsFired}</div>
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '12px',
          padding: '0.4rem 0.8rem',
          backdropFilter: 'blur(8px)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>HITS</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{targetsHit}</div>
        </div>
        {shotsFired > 0 && (
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '12px',
            padding: '0.4rem 0.8rem',
            backdropFilter: 'blur(8px)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>ACC</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
              {Math.round((targetsHit / shotsFired) * 100)}%
            </div>
          </div>
        )}
        {interceptions > 0 && (
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '12px',
            padding: '0.4rem 0.8rem',
            backdropFilter: 'blur(8px)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, color: '#E74C3C' }}>INT</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#E74C3C' }}>{interceptions}</div>
          </div>
        )}
      </div>
      {/* Crosshair overlay - only show during gameplay */}
      {gamePhase === 'playing' && <Crosshair />}
      {/* Power meter */}
      <PowerMeter power={power} maxPower={FOOTBALL_CONFIG.maxPower} isCharging={isPowerCharging} />
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
        {isMobile
          ? 'Drag to aim | Hold to charge | Release to throw'
          : 'Hold to charge | Release on target to throw'}
      </div>
    </BaseGameOverlay>
  )
}
