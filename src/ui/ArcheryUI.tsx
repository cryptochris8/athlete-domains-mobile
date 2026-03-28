import { useGameStore } from '@/stores/useGameStore'
import { useMobileStore } from '@/stores/useMobileStore'
import { useArchery } from '@/games/archery/useArchery'
import { ARCHERY_CONFIG } from '@/games/archery/config'
import { HUD } from '@/ui/HUD'
import { BaseGameOverlay, useOverlayHandlers } from '@/ui/BaseGameOverlay'
import { Crosshair } from '@/games/archery/Crosshair'
import { PowerMeter } from '@/components/PowerMeter'

export function ArcheryOverlay() {
  const timeRemaining = useArchery((s) => s.timeRemaining)
  const shotsFired = useArchery((s) => s.shotsFired)
  const targetsHit = useArchery((s) => s.targetsHit)
  const resetGame = useArchery((s) => s.resetGame)
  const power = useArchery((s) => s.power)
  const isPowerCharging = useArchery((s) => s.isPowerCharging)

  const { handlePlayAgain } = useOverlayHandlers(resetGame)

  const gamePhase = useGameStore((s) => s.gamePhase)
  const isMobile = useMobileStore((s) => s.isMobile)

  return (
    <BaseGameOverlay game="archery" onPlayAgain={handlePlayAgain}>
      <HUD
        gameName="Archery"
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
          <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>SHOTS</div>
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
      </div>
      {/* Crosshair overlay - only show during gameplay */}
      {gamePhase === 'playing' && <Crosshair />}
      {/* Power meter */}
      <PowerMeter power={power} maxPower={ARCHERY_CONFIG.maxPower} isCharging={isPowerCharging} />
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
          ? 'Drag to aim | Hold to charge | Release to shoot'
          : 'Hold to charge | Release on target to hit'}
      </div>
    </BaseGameOverlay>
  )
}
