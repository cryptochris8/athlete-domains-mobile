import { useMobileStore } from '@/stores/useMobileStore'
import { useMinigolf } from '@/games/minigolf/useMinigolf'
import { MINIGOLF_CONFIG, COURSES } from '@/games/minigolf/config'
import { BaseGameOverlay, useOverlayHandlers } from '@/ui/BaseGameOverlay'

export function MinigolfOverlay() {
  const currentHole = useMinigolf((s) => s.currentHole)
  const strokes = useMinigolf((s) => s.strokes)
  const totalStrokes = useMinigolf((s) => s.totalStrokes)
  const isDragging = useMinigolf((s) => s.isDragging)
  const dragStartX = useMinigolf((s) => s.dragStartX)
  const dragStartY = useMinigolf((s) => s.dragStartY)
  const dragEndX = useMinigolf((s) => s.dragEndX)
  const dragEndY = useMinigolf((s) => s.dragEndY)
  const hasGuideLine = useMinigolf((s) => s.hasGuideLine)
  const strokesPerHole = useMinigolf((s) => s.strokesPerHole)
  const resetGame = useMinigolf((s) => s.resetGame)

  const isMobile = useMobileStore((s) => s.isMobile)
  const holeConfig = COURSES[currentHole]

  const dragDistance = isDragging
    ? Math.sqrt((dragStartX - dragEndX) ** 2 + (dragStartY - dragEndY) ** 2)
    : 0
  const powerRatio = Math.min(dragDistance * 0.05 / MINIGOLF_CONFIG.maxPuttPower, 1)
  const powerColor = powerRatio < 0.4 ? '#2ECC71' : powerRatio < 0.7 ? '#F7C948' : '#E74C3C'

  const { handlePlayAgain } = useOverlayHandlers(resetGame)

  return (
    <BaseGameOverlay game="minigolf" onPlayAgain={handlePlayAgain}>
      {/* Hole info header */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        background: 'rgba(0,0,0,0.7)',
        padding: '0.6rem 1.5rem',
        borderRadius: '16px',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none',
        zIndex: 60,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>HOLE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{currentHole + 1}/9</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>PAR</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{holeConfig.par}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>STROKES</div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: strokes === 0 ? '#fff' : strokes <= holeConfig.par - 1 ? '#2ECC71' : strokes === holeConfig.par ? '#4FC3F7' : strokes === holeConfig.par + 1 ? '#F7C948' : '#E74C3C'
          }}>{strokes}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>TOTAL</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalStrokes}</div>
        </div>
      </div>

      {/* Mini Scorecard */}
      {strokesPerHole.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '75px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '3px',
          background: 'rgba(0,0,0,0.7)',
          padding: '0.3rem 0.5rem',
          borderRadius: '10px',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none',
          zIndex: 60,
        }}>
          {strokesPerHole.map((strokes, i) => {
            const par = COURSES[i].par
            const diff = strokes - par
            const color = diff <= -2 ? '#FFD700' : diff === -1 ? '#2ECC71' : diff === 0 ? '#4FC3F7' : diff === 1 ? '#F7C948' : '#E74C3C'
            const label = diff <= -2 ? 'Eagle' : diff === -1 ? 'Birdie' : diff === 0 ? 'Par' : diff === 1 ? 'Bogey' : `+${diff}`
            return (
              <div key={i} style={{
                textAlign: 'center',
                padding: '2px 6px',
                borderRadius: '4px',
                minWidth: '30px',
              }}>
                <div style={{ fontSize: '0.5rem', opacity: 0.5 }}>H{i + 1}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{strokes}</div>
                <div style={{ fontSize: '0.45rem', color, opacity: 0.8 }}>{label}</div>
              </div>
            )
          })}
        </div>
      )}

      {hasGuideLine && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #4FC3F7, #2ECC71)',
          padding: '0.3rem 0.8rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#1A1A2E',
          pointerEvents: 'none',
          zIndex: 60,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          GUIDE LINE!
        </div>
      )}

      {/* Putt power indicator */}
      {isDragging && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '240px',
          pointerEvents: 'none',
          zIndex: 60,
        }}>
          <div style={{ fontSize: '0.85rem', textAlign: 'center', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
            POWER {Math.round(powerRatio * 100)}%
          </div>
          <div style={{
            width: '100%',
            height: '20px',
            borderRadius: '10px',
            background: 'rgba(0,0,0,0.7)',
            overflow: 'hidden',
            border: '3px solid rgba(255,255,255,0.3)',
          }}>
            <div style={{
              width: `${powerRatio * 100}%`,
              height: '100%',
              background: powerColor,
              borderRadius: '7px',
              boxShadow: `0 0 15px ${powerColor}80`,
            }} />
          </div>
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
        {isMobile
          ? 'Drag back to aim and set power, release to putt'
          : 'Click & drag back to aim and set power, release to putt'}
      </div>
    </BaseGameOverlay>
  )
}
