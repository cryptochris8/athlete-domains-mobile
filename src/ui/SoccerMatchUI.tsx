import { useEffect, useState, useRef } from 'react'
import { useSoccerMatchStore } from '@/stores/useSoccerMatchStore'
import { useSoccerSetupStore } from '@/stores/useSoccerSetupStore'
import { useGameStore } from '@/stores/useGameStore'
import { useMobileStore } from '@/stores/useMobileStore'
import { formatMatchTime, type MatchStatus } from '@/systems/matchRules'
import { PowerMeter } from '@/components/PowerMeter'
import { POSSESSION } from '@/systems/possession'
import { audioManager } from '@/core/AudioManager'

function getStatusLabel(status: MatchStatus): string {
  switch (status) {
    case 'waiting': return 'Waiting'
    case 'first-half': return '1st Half'
    case 'halftime': return 'Half Time'
    case 'second-half': return '2nd Half'
    case 'overtime': return 'Extra Time'
    case 'penalties': return 'Penalties'
    case 'finished': return 'Full Time'
  }
}

export function SoccerMatchOverlay() {
  const matchState = useSoccerMatchStore((s) => s.matchState)
  const events = useSoccerMatchStore((s) => s.events)
  const clearEvents = useSoccerMatchStore((s) => s.clearEvents)
  const shootPower = useSoccerMatchStore((s) => s.shootPower)
  const isCharging = useSoccerMatchStore((s) => s.isCharging)
  const kickoffCountdown = useSoccerMatchStore((s) => s.kickoffCountdown)
  const player1Team = useSoccerSetupStore((s) => s.player1Team)
  const playerCount = useSoccerSetupStore((s) => s.playerCount)
  const setGamePhase = useGameStore((s) => s.setGamePhase)
  const isMobile = useMobileStore((s) => s.isMobile)

  const [eventFeed, setEventFeed] = useState<{ id: number; text: string }[]>([])
  const eventIdRef = useRef(0)

  // Process incoming events into the feed
  useEffect(() => {
    if (events.length === 0) return

    const newEntries = events.map((evt) => {
      eventIdRef.current++
      let text = evt
      if (evt.startsWith('goal:home')) text = 'GOAL! Home Team scores!'
      else if (evt.startsWith('goal:away')) text = 'GOAL! Away Team scores!'
      else if (evt === 'halftime') text = 'Half Time!'
      else if (evt === 'second-half-start') text = 'Second Half begins!'
      else if (evt === 'overtime-start') text = 'Extra Time!'
      else if (evt === 'match-end') text = 'Full Time!'
      else if (evt.startsWith('stoppage-time:')) text = `+${evt.split(':')[1]} min added`
      else if (evt.startsWith('momentum:')) {
        const parts = evt.split(':')
        text = `${parts[1] === 'home' ? 'Home' : 'Away'} on fire! ${parts[2]} in a row!`
      }
      return { id: eventIdRef.current, text }
    })

    setEventFeed((prev) => [...newEntries, ...prev].slice(0, 5))
    clearEvents()
  }, [events, clearEvents])

  // Auto-remove old events after 5 seconds
  useEffect(() => {
    if (eventFeed.length === 0) return
    const timer = setTimeout(() => {
      setEventFeed((prev) => prev.slice(0, -1))
    }, 5000)
    return () => clearTimeout(timer)
  }, [eventFeed])

  const { score, halfTimeRemaining, status } = matchState

  return (
    <>
      {/* Pause button - top right */}
      <button
        onClick={() => { audioManager.play('click'); setGamePhase('paused') }}
        aria-label="Pause"
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          fontSize: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          zIndex: 60,
          pointerEvents: 'auto',
        }}
      >
        | |
      </button>

      {/* Match HUD - top center */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: 'rgba(0,0,0,0.8)',
        padding: '0.8rem 1.5rem',
        borderRadius: '16px',
        pointerEvents: 'none',
        zIndex: 60,
        minWidth: '280px',
        justifyContent: 'center',
      }}>
        {/* Home score */}
        <div style={{ textAlign: 'center', minWidth: '50px' }}>
          <div style={{ fontSize: '0.65rem', opacity: 0.6, letterSpacing: '1px' }}>HOME</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#2196F3' }}>{score.home}</div>
          {player1Team === 'home' && (
            <div style={{ fontSize: '0.55rem', color: '#4ECDC4', fontWeight: 700, letterSpacing: '1px' }}>YOU</div>
          )}
        </div>

        {/* Timer + status */}
        <div style={{ textAlign: 'center', padding: '0 0.8rem' }}>
          <div style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            fontFamily: 'monospace',
            color: status === 'halftime' || status === 'finished' ? '#F7C948' : '#fff',
          }}>
            {status === 'halftime' || status === 'finished' || status === 'waiting'
              ? '--:--'
              : formatMatchTime(halfTimeRemaining)}
          </div>
          <div style={{
            fontSize: '0.65rem',
            opacity: 0.7,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: status === 'finished' ? '#F7C948' : 'rgba(255,255,255,0.7)',
          }}>
            {getStatusLabel(status)}
          </div>
        </div>

        {/* Away score */}
        <div style={{ textAlign: 'center', minWidth: '50px' }}>
          <div style={{ fontSize: '0.65rem', opacity: 0.6, letterSpacing: '1px' }}>AWAY</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#E74C3C' }}>{score.away}</div>
          {player1Team === 'away' && (
            <div style={{ fontSize: '0.55rem', color: '#4ECDC4', fontWeight: 700, letterSpacing: '1px' }}>YOU</div>
          )}
        </div>
      </div>

      {/* Events feed - top right */}
      {eventFeed.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          pointerEvents: 'none',
          zIndex: 60,
        }}>
          {eventFeed.map((evt) => (
            <div key={evt.id} style={{
              background: evt.text.startsWith('GOAL')
                ? 'linear-gradient(135deg, rgba(46,204,113,0.9), rgba(39,174,96,0.9))'
                : 'rgba(0,0,0,0.7)',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: evt.text.startsWith('GOAL') ? 700 : 500,
              animation: 'fadeIn 0.3s ease-out',
            }}>
              {evt.text}
            </div>
          ))}
        </div>
      )}

      {/* Controls hint */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '0.8rem',
        opacity: 0.5,
        pointerEvents: 'none',
        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        zIndex: 60,
        textAlign: 'center',
      }}>
        {isMobile
          ? 'Joystick move · Push far to run · Shoot & Pass buttons on right'
          : playerCount === 2
            ? 'P1: WASD + L-CLICK/R-CLICK + SHIFT | P2: Arrows + Numpad1 shoot + Numpad2 pass'
            : 'WASD move | HOLD L-CLICK shoot | R-CLICK pass | SHIFT sprint'}
      </div>

      {/* Halftime banner */}
      {status === 'halftime' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.85)',
          padding: '2rem 4rem',
          borderRadius: '20px',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 70,
          backdropFilter: 'blur(15px)',
          border: '2px solid rgba(255,215,0,0.3)',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F7C948', marginBottom: '0.5rem' }}>
            Half Time
          </div>
          <div style={{ fontSize: '1.2rem', opacity: 0.7 }}>
            {score.home} - {score.away}
          </div>
        </div>
      )}

      {/* Kickoff countdown */}
      {kickoffCountdown !== null && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 75,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '6rem',
            fontWeight: 900,
            color: '#fff',
            textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 0 60px rgba(255,215,0,0.4)',
            lineHeight: 1,
          }}>
            {kickoffCountdown}
          </div>
          <div style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            marginTop: '0.5rem',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}>
            KICK OFF
          </div>
        </div>
      )}

      {/* Power meter */}
      <PowerMeter
        power={shootPower}
        maxPower={POSSESSION.MAX_SHOOT_FORCE}
        isCharging={isCharging}
        label="SHOT POWER"
      />

      {/* Full time banner */}
      {status === 'finished' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.9)',
          padding: '2rem 4rem',
          borderRadius: '20px',
          textAlign: 'center',
          pointerEvents: 'auto',
          zIndex: 70,
          backdropFilter: 'blur(15px)',
          border: '2px solid rgba(255,215,0,0.4)',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F7C948', marginBottom: '0.5rem' }}>
            Full Time
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>
            <span style={{ color: '#2196F3' }}>{score.home}</span>
            {' - '}
            <span style={{ color: '#E74C3C' }}>{score.away}</span>
          </div>
          <div style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '1rem' }}>
            {score.home === score.away
              ? 'Draw!'
              : (score.home > score.away) === (player1Team === 'home')
                ? 'You Win!'
                : 'You Lose!'}
          </div>
        </div>
      )}
    </>
  )
}
