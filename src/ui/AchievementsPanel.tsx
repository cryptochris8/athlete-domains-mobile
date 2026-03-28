import { useProgressStore } from '@/stores/useProgressStore'
import { ACHIEVEMENT_CATALOG } from '@/systems/achievements'
import { audioManager } from '@/core/AudioManager'

interface AchievementsPanelProps {
  onClose: () => void
}

export function AchievementsPanel({ onClose }: AchievementsPanelProps) {
  const achievements = useProgressStore((s) => s.achievements)
  const earnedIds = new Set(achievements.map((a) => a.id))

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      zIndex: 100, pointerEvents: 'auto',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1A1A2E, #16213E)',
        borderRadius: '24px', padding: '2rem', maxWidth: '600px', width: '90%',
        maxHeight: '80vh', overflowY: 'auto',
        border: '2px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFD700' }}>
            Achievements ({achievements.length}/{ACHIEVEMENT_CATALOG.length})
          </h2>
          <button
            onClick={() => { audioManager.play('click'); onClose() }}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
              padding: '0.5rem 1rem', color: '#fff', cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            Close
          </button>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.8rem',
        }}>
          {ACHIEVEMENT_CATALOG.map((def) => {
            const earned = earnedIds.has(def.id)
            return (
              <div
                key={def.id}
                style={{
                  background: earned ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                  border: earned ? '2px solid rgba(255,215,0,0.4)' : '2px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', padding: '0.8rem', textAlign: 'center',
                  opacity: earned ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>
                  {earned ? '🏆' : '🔒'}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                  {def.name}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7, lineHeight: 1.3 }}>
                  {earned ? def.description : '???'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
