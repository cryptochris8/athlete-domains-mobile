import { useRef, useState, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { TargetType } from './config'
import { AnimalTarget } from './AnimalTarget'

interface TargetProps {
  targetType: TargetType
  startPosition: [number, number, number]
  direction: number // 1 = left to right, -1 = right to left
  speedScale: number
  sizeScale: number
  onHit: (points: number, position: [number, number, number]) => void
  onExpired: () => void
  onDeath: () => void
}

export function Target({ targetType, startPosition, direction, speedScale, sizeScale, onHit, onExpired, onDeath }: TargetProps) {
  const groupRef = useRef<Group>(null)
  const [visible, setVisible] = useState(true)
  // Use refs for animation flags — useFrame reads these every frame,
  // and useState closures would be stale for 1-3 frames after setState
  const frozenRef = useRef(false)
  const dyingRef = useRef(false)
  const aliveRef = useRef(true)
  const elapsed = useRef(0)
  const dyingElapsed = useRef(0)
  const frozenElapsed = useRef(0)
  const speed = targetType.speed * speedScale
  const hitboxSize = targetType.size * sizeScale

  const DYING_DURATION = 0.6
  // Delay dying animation so the arrow visually arrives before NPC reacts
  const DEATH_DELAY = 0.25

  useFrame((_, delta) => {
    if (!groupRef.current || !aliveRef.current) return

    // Dying animation: spin + scale down
    if (dyingRef.current) {
      dyingElapsed.current += delta
      const progress = Math.min(dyingElapsed.current / DYING_DURATION, 1)
      groupRef.current.scale.setScalar(1 - progress)
      groupRef.current.rotation.y += delta * 12
      if (progress >= 1) {
        aliveRef.current = false
        setVisible(false)
        onDeath()
      }
      return
    }

    // Frozen = hit registered, waiting for arrow to arrive before dying
    if (frozenRef.current) {
      frozenElapsed.current += delta
      if (frozenElapsed.current >= DEATH_DELAY) {
        dyingRef.current = true
        dyingElapsed.current = 0
      }
      return
    }

    elapsed.current += delta

    // Move along x-axis
    const x = startPosition[0] + direction * speed * elapsed.current
    groupRef.current.position.x = x

    // Animals run on the ground — keep y at start position
    groupRef.current.position.y = startPosition[1]
    groupRef.current.position.z = startPosition[2]

    // Check if out of bounds
    if (Math.abs(x - startPosition[0]) > 24) {
      aliveRef.current = false
      setVisible(false)
      onExpired()
    }
  })

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    if (!aliveRef.current || dyingRef.current || frozenRef.current || !groupRef.current) return
    frozenRef.current = true
    frozenElapsed.current = 0
    const pos: [number, number, number] = [
      groupRef.current.position.x,
      groupRef.current.position.y + 1,
      groupRef.current.position.z,
    ]
    onHit(targetType.points, pos)
  }

  if (!visible) return null

  return (
    <group ref={groupRef} position={startPosition}>
      {/* Invisible hit box — generous size for easy clicking */}
      <mesh onPointerUp={handleClick} visible={false} position={[0, hitboxSize * 1.2, 0]}>
        <boxGeometry args={[hitboxSize * 3, hitboxSize * 3, hitboxSize * 3]} />
        <meshBasicMaterial />
      </mesh>

      {/* Colored glow ring on the ground beneath the animal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[hitboxSize * 0.6, hitboxSize * 1.0, 24]} />
        <meshStandardMaterial
          color={targetType.color}
          emissive={targetType.color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.6}
          side={2}
        />
      </mesh>

      {/* Point value indicator light */}
      <pointLight
        color={targetType.color}
        intensity={1.5}
        distance={5}
        position={[0, 1, 0]}
      />

      {/* 3D animal model */}
      <Suspense fallback={
        <mesh position={[0, hitboxSize, 0]}>
          <sphereGeometry args={[hitboxSize * 0.5, 8, 8]} />
          <meshStandardMaterial color={targetType.color} />
        </mesh>
      }>
        <AnimalTarget
          modelPath={targetType.model}
          scale={targetType.modelScale * sizeScale}
          color={targetType.color}
          direction={direction}
          runAnim={targetType.runAnim}
        />
      </Suspense>
    </group>
  )
}
