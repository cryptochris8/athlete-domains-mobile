import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface ConfettiProps {
  position: [number, number, number]
  count?: number
}

export function Confetti({ position, count = 50 }: ConfettiProps) {
  const reducedMotion = useReducedMotion()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const startClock = useRef(-1)

  const particles = useMemo(() => {
    if (reducedMotion) return []
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        position[0] + (Math.random() - 0.5) * 2,
        position[1] + Math.random() * 0.5,
        position[2] + (Math.random() - 0.5) * 2,
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 6 + 2,
        (Math.random() - 0.5) * 4,
      ),
      color: new THREE.Color().setHSL(Math.random(), 0.9, 0.6),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 10,
    }))
  }, [position, count, reducedMotion])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    if (reducedMotion || !meshRef.current) return
    if (startClock.current < 0) startClock.current = state.clock.elapsedTime
    const elapsed = state.clock.elapsedTime - startClock.current
    if (elapsed > 3) return

    particles.forEach((p, i) => {
      const t = elapsed
      dummy.position.set(
        p.position.x + p.velocity.x * t,
        p.position.y + p.velocity.y * t - 4.9 * t * t,
        p.position.z + p.velocity.z * t,
      )
      dummy.rotation.set(p.rotation + p.rotSpeed * t, p.rotation * 0.5, 0)
      dummy.scale.setScalar(Math.max(0, 1 - elapsed / 3))
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
      meshRef.current!.setColorAt(i, p.color)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  useEffect(() => {
    return () => {
      if (meshRef.current) {
        meshRef.current.geometry.dispose()
        if (Array.isArray(meshRef.current.material)) {
          meshRef.current.material.forEach(m => m.dispose())
        } else {
          meshRef.current.material.dispose()
        }
      }
    }
  }, [])

  if (reducedMotion) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.05, 0.05, 0.01]} />
      <meshStandardMaterial />
    </instancedMesh>
  )
}
