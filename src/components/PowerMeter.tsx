interface PowerMeterProps {
  power: number
  maxPower: number
  minPower?: number
  isCharging: boolean
  label?: string
}

export function PowerMeter({ power, maxPower, minPower = 0, isCharging, label = 'POWER' }: PowerMeterProps) {
  if (!isCharging && power === 0) return null

  // Display 0-100% across the min→max range so the bar starts empty
  const ratio = minPower < maxPower
    ? Math.max(0, (power - minPower) / (maxPower - minPower))
    : power / maxPower
  const color = ratio < 0.4 ? '#2ECC71' : ratio < 0.7 ? '#F7C948' : '#E74C3C'
  const percent = Math.round(ratio * 100)

  return (
    <div style={{
      position: 'absolute',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '320px',
      zIndex: 60,
      pointerEvents: 'none',
    }}>
      <div style={{
        fontSize: '0.85rem',
        textAlign: 'center',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '3px',
        fontWeight: 700,
        color: '#fff',
        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
      }}>
        {label} {percent}%
      </div>
      <div style={{
        width: '100%',
        height: '24px',
        borderRadius: '12px',
        background: 'rgba(0,0,0,0.7)',
        overflow: 'hidden',
        border: '3px solid rgba(255,255,255,0.3)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        <div style={{
          width: `${ratio * 100}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          borderRadius: '9px',
          transition: isCharging ? 'none' : 'width 0.1s ease',
          boxShadow: `0 0 20px ${color}80, inset 0 1px 0 rgba(255,255,255,0.3)`,
        }} />
        {/* Tick marks at 25%, 50%, 75% */}
        {[25, 50, 75].map((tick) => (
          <div key={tick} style={{
            position: 'absolute',
            left: `${tick}%`,
            top: 0,
            width: '2px',
            height: '100%',
            background: 'rgba(255,255,255,0.4)',
          }} />
        ))}
      </div>
    </div>
  )
}
