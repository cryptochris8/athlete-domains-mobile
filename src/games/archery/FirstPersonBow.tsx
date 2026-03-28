import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface FirstPersonBowProps {
  shooting: boolean
}

/**
 * First-person bow model attached to the camera (lower-right, Minecraft-style).
 * Plays a recoil animation when `shooting` flips to true.
 */
export function FirstPersonBow({ shooting }: FirstPersonBowProps) {
  const { camera } = useThree()
  const { scene } = useGLTF('/models/bow/scene.gltf')
  const groupRef = useRef<THREE.Group>(null)
  const recoilRef = useRef({ active: false, elapsed: 0 })

  // Attach bow group to camera on mount, detach on unmount
  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    camera.add(group)
    return () => {
      camera.remove(group)
    }
  }, [camera])

  // Trigger recoil when shooting changes to true
  useEffect(() => {
    if (shooting) {
      recoilRef.current = { active: true, elapsed: 0 }
    }
  }, [shooting])

  // Animate recoil
  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    const recoil = recoilRef.current
    if (!recoil.active) return

    recoil.elapsed += delta
    const kickDuration = 0.1
    const returnDuration = 0.3
    const totalDuration = kickDuration + returnDuration
    const maxKick = 0.3 // radians of backward rotation

    if (recoil.elapsed < kickDuration) {
      // Kick back
      const t = recoil.elapsed / kickDuration
      group.rotation.x = -Math.PI / 6 + maxKick * t
    } else if (recoil.elapsed < totalDuration) {
      // Ease back to rest
      const t = (recoil.elapsed - kickDuration) / returnDuration
      const eased = 1 - (1 - t) * (1 - t) // ease-out quadratic
      group.rotation.x = -Math.PI / 6 + maxKick * (1 - eased)
    } else {
      // Done
      group.rotation.x = -Math.PI / 6
      recoil.active = false
    }
  })

  return (
    <group
      ref={groupRef}
      position={[0.5, -0.4, -0.8]}
      rotation={[-Math.PI / 6, Math.PI / 2, 0]}
      scale={0.15}
    >
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload('/models/bow/scene.gltf')
