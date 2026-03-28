import { useState, useEffect } from 'react'

export function Crosshair() {
  const [pos, setPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: pos.y,
      left: pos.x,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 55,
    }}>
      {/* Horizontal line */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '28px',
        height: '2px',
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 0 4px rgba(0,0,0,0.8)',
      }} />
      {/* Vertical line */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '2px',
        height: '28px',
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 0 4px rgba(0,0,0,0.8)',
      }} />
      {/* Center dot */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: '#E74C3C',
        boxShadow: '0 0 8px rgba(231, 76, 60, 0.8)',
      }} />
      {/* Outer circle */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        border: '1px solid rgba(255, 255, 255, 0.4)',
      }} />
    </div>
  )
}
