import { useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { FootballTarget } from './Target'
import { FOOTBALL_CONFIG, pickFootballTarget } from './config'
import type { FootballTargetType } from './config'

interface ActiveTarget {
  id: number
  targetType: FootballTargetType
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

export function FootballTargetSpawner({ maxTargets, speedScale, sizeScale, paused, onTargetHit }: TargetSpawnerProps) {
  const [targets, setTargets] = useState<ActiveTarget[]>([])
  const spawnTimer = useRef(0)

  const spawnTarget = useCallback(() => {
    const targetType = pickFootballTarget()
    const direction = Math.random() > 0.5 ? 1 : -1
    const startX = direction === 1 ? -12 : 12
    const y = FOOTBALL_CONFIG.targetMinY
    const z = -5 - Math.random() * 15

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
    if (spawnTimer.current >= FOOTBALL_CONFIG.spawnIntervalSeconds && targets.length < maxTargets) {
      spawnTimer.current = 0
      spawnTarget()
    }
  })

  return (
    <group>
      {targets.map((t) => (
        <FootballTarget
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
