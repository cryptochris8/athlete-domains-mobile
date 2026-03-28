import { useEffect, useState } from 'react'
import { useProgressStore } from '@/stores/useProgressStore'
import type { Achievement } from '@/types'

export function AchievementToast() {
  const recentUnlocks = useProgressStore((s) => s.recentUnlocks)
  const clearRecentUnlocks = useProgressStore((s) => s.clearRecentUnlocks)
  const [visible, setVisible] = useState<Achievement | null>(null)

  useEffect(() => {
    if (recentUnlocks.length > 0 && !visible) {
      setVisible(recentUnlocks[0])
      clearRecentUnlocks()

      setTimeout(() => setVisible(null), 4000)
    }
  }, [recentUnlocks, visible, clearRecentUnlocks])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      top: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: '#1A1A2E',
      padding: '0.8rem 1.5rem',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.8rem',
      zIndex: 200,
      boxShadow: '0 8px 32px rgba(255,165,0,0.4)',
      animation: 'slideDown 0.3s ease-out',
    }}>
      <span style={{ fontSize: '1.5rem' }}>🏆</span>
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Achievement Unlocked!
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{visible.name}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{visible.description}</div>
      </div>
    </div>
  )
}
