import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleExplosionProps {
  position: [number, number, number]
  color?: string
  count?: number
  /** Duration in seconds */
  duration?: number
  onComplete?: () => void
}

/**
 * Short burst of particles at an impact point.
 * Auto-removes after `duration` seconds.
 */
export function ParticleExplosion({
  position,
  color = '#F7C948',
  count = 20,
  duration = 1,
  onComplete,
}: ParticleExplosionProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const startTime = useRef(-1)

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 6,
      ),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 8,
    }))
  }, [count])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const particleColor = useMemo(() => new THREE.Color(color), [color])

  useFrame((state) => {
    if (!meshRef.current) return
    if (startTime.current < 0) startTime.current = state.clock.elapsedTime
    const elapsed = state.clock.elapsedTime - startTime.current

    if (elapsed > duration) {
      if (onComplete) onComplete()
      return
    }

    const progress = elapsed / duration

    particles.forEach((p, i) => {
      dummy.position.set(
        position[0] + p.velocity.x * elapsed,
        position[1] + p.velocity.y * elapsed - 4.9 * elapsed * elapsed,
        position[2] + p.velocity.z * elapsed,
      )
      dummy.rotation.set(p.rotation + p.rotSpeed * elapsed, 0, 0)
      dummy.scale.setScalar(Math.max(0, 1 - progress))
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
      meshRef.current!.setColorAt(i, particleColor)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.03, 6, 6]} />
      <meshStandardMaterial />
    </instancedMesh>
  )
}
