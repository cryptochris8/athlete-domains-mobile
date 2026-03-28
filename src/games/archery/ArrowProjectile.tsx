import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'

interface ArrowProjectileProps {
  startPosition: [number, number, number]
  endPosition: [number, number, number]
  onComplete: () => void
}

const FLIGHT_DURATION = 0.3 // seconds

/**
 * Visual arrow that flies from startPosition to endPosition over 0.3s.
 * Direction is set once on first frame to avoid tumbling near the target.
 */
export function ArrowProjectile({ startPosition, endPosition, onComplete }: ArrowProjectileProps) {
  const { scene } = useGLTF('/models/arrow/scene.gltf')
  const groupRef = useRef<THREE.Group>(null)
  const elapsedRef = useRef(0)
  const completedRef = useRef(false)
  const directionSet = useRef(false)

  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])

  const start = useMemo(() => new THREE.Vector3(...startPosition), [startPosition])
  const end = useMemo(() => new THREE.Vector3(...endPosition), [endPosition])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || completedRef.current) return

    // Set flight direction once on first frame, then keep it fixed
    if (!directionSet.current) {
      group.lookAt(end)
      directionSet.current = true
    }

    elapsedRef.current += delta
    const t = Math.min(elapsedRef.current / FLIGHT_DURATION, 1)

    // Lerp position only — rotation stays fixed
    group.position.lerpVectors(start, end, t)

    if (t >= 1 && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  })

  return (
    <group ref={groupRef} position={startPosition} scale={3}>
      <primitive object={clone} />
    </group>
  )
}

useGLTF.preload('/models/arrow/scene.gltf')
