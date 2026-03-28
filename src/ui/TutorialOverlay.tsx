import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useMobileStore } from '@/stores/useMobileStore'
import { audioManager } from '@/core/AudioManager'
import { COLORS } from '@/core/constants'
import type { Scene } from '@/types'

const TUTORIALS: Record<string, { title: string; controls: string[]; mobileControls?: string[] }> = {
  basketball: {
    title: 'Basketball',
    controls: [
      'Move mouse or Arrow keys to aim left/right',
      'Hold click or Space to charge power',
      'Release to shoot!',
      'Swish = 5pts, Backboard = 3pts, Rim = 2pts',
    ],
    mobileControls: [
      'Use joystick to aim left/right',
      'Tap & hold Shoot to charge power',
      'Release Shoot to throw!',
      'Swish = 5pts, Backboard = 3pts, Rim = 2pts',
    ],
  },
  soccer: {
    title: 'Penalty Kick',
    controls: [
      'Move mouse to aim at the goal',
      'Hold click or Space to charge power',
      'Release to kick!',
      'Try to get past the goalkeeper',
    ],
    mobileControls: [
      'Use joystick to move aim reticle on goal',
      'Tap & hold Shoot to charge power',
      'Release Shoot to kick!',
      'Try to get past the goalkeeper',
    ],
  },
  'soccer-match': {
    title: 'Soccer Match',
    controls: [
      'WASD to move your player around the pitch',
      'Hold Left Click or Space to charge a shot',
      'Right Click or E to pass to a teammate',
      'Shift to sprint — score more goals than the opponent!',
    ],
    mobileControls: [
      'Use joystick to move — push far to run',
      'Tap & hold Shoot to charge a shot',
      'Tap Pass to pass to a teammate',
      'Score more goals than the opponent!',
    ],
  },
  bowling: {
    title: 'Bowling',
    controls: [
      'Move mouse or Arrow keys to position on the lane',
      'Click or Space to start power meter',
      'Click or Space again to set spin',
      'Click or Space once more to release!',
    ],
    mobileControls: [
      'Use joystick to position on the lane',
      'Tap Shoot to start power meter',
      'Tap Shoot again to set spin',
      'Tap Shoot once more to release!',
    ],
  },
  minigolf: {
    title: 'Mini Golf',
    controls: [
      'Click and drag backwards to aim (slingshot style)',
      'The further you drag, the harder the putt',
      'Release to putt the ball',
      'Lower strokes = better score!',
    ],
    mobileControls: [
      'Drag backwards to aim (slingshot style)',
      'The further you drag, the harder the putt',
      'Release to putt the ball',
      'Lower strokes = better score!',
    ],
  },
  archery: {
    title: 'Archery',
    controls: [
      'Move mouse to aim the crosshair',
      'Hold click to charge your shot',
      'Release to fire an arrow at moving targets',
      'Hit high-value targets for big points — 90 second timer!',
    ],
    mobileControls: [
      'Drag to aim the crosshair',
      'Tap & hold to charge your shot',
      'Release to fire an arrow at moving targets',
      'Hit high-value targets for big points — 90 second timer!',
    ],
  },
  football: {
    title: 'Football',
    controls: [
      'Move mouse to aim the crosshair at receivers',
      'Hold click to charge your throw',
      'Release to throw the football',
      'Hit moving receivers and avoid defenders!',
    ],
    mobileControls: [
      'Drag to aim the crosshair at receivers',
      'Tap & hold to charge your throw',
      'Release to throw the football',
      'Hit moving receivers and avoid defenders!',
    ],
  },
}

// Track which games the player has seen tutorials for
const seenKey = 'three-j-tutorials-seen'
function getSeenTutorials(): Set<string> {
  try {
    const data = localStorage.getItem(seenKey)
    return data ? new Set(JSON.parse(data)) : new Set()
  } catch {
    return new Set()
  }
}
function markSeen(game: string) {
  const seen = getSeenTutorials()
  seen.add(game)
  localStorage.setItem(seenKey, JSON.stringify([...seen]))
}

interface TutorialOverlayProps {
  game: Scene
}

export function TutorialOverlay({ game }: TutorialOverlayProps) {
  const showTutorials = useSettingsStore((s) => s.showTutorials)
  const isMobile = useMobileStore((s) => s.isMobile)
  const [visible, setVisible] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showTutorials) return
    const seen = getSeenTutorials()
    if (!seen.has(game) && TUTORIALS[game]) {
      setVisible(true)
    }
  }, [game, showTutorials])

  useEffect(() => {
    if (visible) buttonRef.current?.focus()
  }, [visible])

  if (!visible) return null

  const tutorial = TUTORIALS[game]
  if (!tutorial) return null

  const handleDismiss = () => {
    audioManager.play('click')
    markSeen(game)
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label={`Tutorial: How to play ${tutorial.title}`}
      aria-modal="true"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 80,
        pointerEvents: 'auto',
      }}
      onClick={handleDismiss}
    >
      <div
        style={{
          background: 'rgba(26,26,46,0.95)',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '400px',
          border: '2px solid rgba(255,107,53,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '1rem',
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          How to Play {tutorial.title}
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
          {(isMobile && tutorial.mobileControls ? tutorial.mobileControls : tutorial.controls).map((ctrl, i) => (
            <li key={i} style={{
              padding: '0.5rem 0',
              borderBottom: i < tutorial.controls.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              fontSize: '0.95rem',
              opacity: 0.9,
            }}>
              {ctrl}
            </li>
          ))}
        </ul>
        <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '1rem' }}>
          {isMobile ? 'Tap pause button to pause anytime' : 'Press Escape to pause anytime'}
        </div>
        <button
          ref={buttonRef}
          onClick={handleDismiss}
          aria-label="Dismiss tutorial"
          style={{
            width: '100%',
            padding: '0.8rem',
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
            color: COLORS.dark,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  )
}
