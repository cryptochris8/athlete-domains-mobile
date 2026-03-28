import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { FOOTBALL_CONFIG } from './config'

interface FootballProjectileProps {
  startPosition: [number, number, number]
  endPosition: [number, number, number]
  onComplete: () => void
  onIntercepted?: () => void
  checkDefenderCollision?: (pos: [number, number, number]) => number
}

const FLIGHT_DURATION = 0.35
const SPIRAL_SPEED = 15 // radians per second (~2.4 rotations/sec)

// Reusable vectors — hoisted to module level to avoid per-frame GC
const _tangent = new THREE.Vector3()
const _footballLongAxis = new THREE.Vector3(1, 0, 0)
const _alignQuat = new THREE.Quaternion()

export function FootballProjectile({ startPosition, endPosition, onComplete, onIntercepted, checkDefenderCollision }: FootballProjectileProps) {
  const { scene } = useGLTF('/models/football/scene.gltf')
  const groupRef = useRef<THREE.Group>(null)
  const elapsedRef = useRef(0)
  const completedRef = useRef(false)

  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])

  const start = useMemo(() => new THREE.Vector3(...startPosition), [startPosition])
  const end = useMemo(() => new THREE.Vector3(...endPosition), [endPosition])

  // Pre-compute horizontal velocity (constant throughout flight)
  const horizontalVelocity = useMemo(() => {
    return new THREE.Vector3().subVectors(end, start).multiplyScalar(1 / FLIGHT_DURATION)
  }, [start, end])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || completedRef.current) return

    elapsedRef.current += delta
    const t = Math.min(elapsedRef.current / FLIGHT_DURATION, 1)

    // Lerp position with parabolic arc
    group.position.lerpVectors(start, end, t)
    const arcHeight = FOOTBALL_CONFIG.footballArcHeight * Math.sin(t * Math.PI)
    group.position.y += arcHeight

    // Compute trajectory tangent (velocity direction including arc)
    // Derivative of arc: arcHeight * PI * cos(t * PI) / duration
    _tangent.copy(horizontalVelocity)
    const verticalVel = (FOOTBALL_CONFIG.footballArcHeight * Math.PI * Math.cos(t * Math.PI)) / FLIGHT_DURATION
    _tangent.y += verticalVel
    _tangent.normalize()

    // Align football's +X axis (model's long axis) to the tangent direction
    _alignQuat.setFromUnitVectors(_footballLongAxis, _tangent)
    group.quaternion.copy(_alignQuat)

    // Add spiral rotation around the football's local long axis (+X)
    group.rotateOnAxis(_footballLongAxis, SPIRAL_SPEED * delta)

    // Check collision with defenders
    if (!completedRef.current && checkDefenderCollision && onIntercepted) {
      const hitIdx = checkDefenderCollision([group.position.x, group.position.y, group.position.z])
      if (hitIdx >= 0) {
        completedRef.current = true
        onIntercepted()
        return
      }
    }

    if (t >= 1 && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  })

  return (
    <group ref={groupRef} position={startPosition} scale={FOOTBALL_CONFIG.footballScale}>
      <primitive object={clone} />
    </group>
  )
}

useGLTF.preload('/models/football/scene.gltf')
