import { useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { audioManager } from '@/core/AudioManager'
import { COLORS } from '@/core/constants'

function VolumeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <span style={{ fontSize: '0.85rem', opacity: 0.8, minWidth: '50px' }}>{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={`${label} volume`}
        style={{ flex: 1, accentColor: COLORS.primary }}
      />
      <span style={{ fontSize: '0.75rem', opacity: 0.6, minWidth: '30px', textAlign: 'right' }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}

export function PauseMenu() {
  const setGamePhase = useGameStore((s) => s.setGamePhase)
  const returnToMenu = useGameStore((s) => s.returnToMenu)
  const resumeRef = useRef<HTMLButtonElement>(null)

  const sfxVolume = useSettingsStore((s) => s.sfxVolume)
  const musicVolume = useSettingsStore((s) => s.musicVolume)
  const voiceVolume = useSettingsStore((s) => s.voiceVolume)
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume)
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume)
  const setVoiceVolume = useSettingsStore((s) => s.setVoiceVolume)
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality)
  const setGraphicsQuality = useSettingsStore((s) => s.setGraphicsQuality)

  // Focus trap: auto-focus resume button when pause menu opens
  useEffect(() => {
    resumeRef.current?.focus()
  }, [])

  return (
    <div
      role="dialog"
      aria-label="Pause menu"
      aria-modal="true"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 90,
      }}
    >
      <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 700, marginBottom: '1.5rem' }}>
        Paused
      </h2>

      {/* Volume controls */}
      <div style={{
        width: '260px',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '1rem',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.05)',
      }}>
        <VolumeSlider label="SFX" value={sfxVolume} onChange={setSfxVolume} />
        <VolumeSlider label="Music" value={musicVolume} onChange={setMusicVolume} />
        <VolumeSlider label="Voice" value={voiceVolume} onChange={setVoiceVolume} />
      </div>

      {/* Graphics quality */}
      <div style={{
        width: '260px',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.8rem 1rem',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontSize: '0.85rem', opacity: 0.8, minWidth: '60px' }}>Graphics</span>
        {(['low', 'medium', 'high'] as const).map((q) => (
          <button
            key={q}
            onClick={() => { audioManager.play('switchFlip'); setGraphicsQuality(q) }}
            style={{
              flex: 1,
              padding: '0.6rem',
              fontSize: '0.75rem',
              minHeight: '44px',
              fontWeight: graphicsQuality === q ? 700 : 400,
              borderRadius: '8px',
              background: graphicsQuality === q
                ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`
                : 'rgba(255,255,255,0.08)',
              color: graphicsQuality === q ? COLORS.dark : COLORS.white,
              border: 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {q}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '220px' }}>
        <button
          ref={resumeRef}
          onClick={() => { audioManager.play('click'); setGamePhase('playing') }}
          aria-label="Resume game"
          style={{
            padding: '0.8rem',
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
            color: COLORS.dark,
          }}
        >
          Resume
        </button>
        <button
          onClick={() => { audioManager.play('click'); returnToMenu() }}
          aria-label="Back to games"
          style={{
            padding: '0.8rem',
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.1)',
            color: COLORS.white,
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          Back to Games
        </button>
      </div>
    </div>
  )
}
