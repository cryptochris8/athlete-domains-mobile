import { useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Target } from './Target'
import { ARCHERY_CONFIG, pickTargetType } from './config'
import type { TargetType } from './config'

interface ActiveTarget {
  id: number
  targetType: TargetType
  startPosition: [number, number, number]
  direction: number
}

interface TargetSpawnerProps {
  maxTargets: number
  speedScale: number
  sizeScale: number
  paused: boolean
  onTargetHit: (points: number, position: [number, number, number], label: string, color: string) => void
}

let nextId = 0

export function TargetSpawner({ maxTargets, speedScale, sizeScale, paused, onTargetHit }: TargetSpawnerProps) {
  const [targets, setTargets] = useState<ActiveTarget[]>([])
  const spawnTimer = useRef(0)

  const spawnTarget = useCallback(() => {
    const targetType = pickTargetType()
    const direction = Math.random() > 0.5 ? 1 : -1
    const startX = direction === 1 ? -12 : 12
    const y = ARCHERY_CONFIG.targetMinY + Math.random() * (ARCHERY_CONFIG.targetMaxY - ARCHERY_CONFIG.targetMinY)
    const z = -5 - Math.random() * 15 // Spread targets across range depth

    const target: ActiveTarget = {
      id: nextId++,
      targetType,
      startPosition: [startX, y, z],
      direction,
    }

    setTargets((prev) => [...prev, target])
  }, [])

  const removeTarget = useCallback((id: number) => {
    setTargets((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useFrame((_, delta) => {
    if (paused) return

    spawnTimer.current += delta
    if (spawnTimer.current >= ARCHERY_CONFIG.spawnIntervalSeconds && targets.length < maxTargets) {
      spawnTimer.current = 0
      spawnTarget()
    }
  })

  return (
    <group>
      {targets.map((t) => (
        <Target
          key={t.id}
          targetType={t.targetType}
          startPosition={t.startPosition}
          direction={t.direction}
          speedScale={speedScale}
          sizeScale={sizeScale}
          onHit={(points, position) => {
            onTargetHit(points, position, t.targetType.label, t.targetType.color)
          }}
          onExpired={() => removeTarget(t.id)}
          onDeath={() => removeTarget(t.id)}
        />
      ))}
    </group>
  )
}
