import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface MinecraftAvatarProps {
  isMoving?: boolean
  color?: string
  scale?: number
}

/**
 * Box-geometry Minecraft-style player model.
 * Body parts are colored boxes with walking animation.
 */
export function MinecraftAvatar({ isMoving = false, color = '#c4a882', scale = 1 }: MinecraftAvatarProps) {
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!leftArmRef.current || !rightArmRef.current || !leftLegRef.current || !rightLegRef.current) return

    if (isMoving) {
      const t = state.clock.elapsedTime * 6
      const swing = Math.sin(t) * 0.6
      leftArmRef.current.rotation.x = swing
      rightArmRef.current.rotation.x = -swing
      leftLegRef.current.rotation.x = -swing
      rightLegRef.current.rotation.x = swing
    } else {
      leftArmRef.current.rotation.x = 0
      rightArmRef.current.rotation.x = 0
      leftLegRef.current.rotation.x = 0
      rightLegRef.current.rotation.x = 0
    }
  })

  const skinColor = color
  const shirtColor = adjustColor(color, -30)
  const pantsColor = adjustColor(color, -60)

  return (
    <group scale={scale}>
      {/* Head */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.5, 0.75, 0.3]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>

      {/* Left arm - pivot at shoulder */}
      <group ref={leftArmRef} position={[-0.4, 1.25, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.25, 0.7, 0.25]} />
          <meshStandardMaterial color={shirtColor} />
        </mesh>
      </group>

      {/* Right arm - pivot at shoulder */}
      <group ref={rightArmRef} position={[0.4, 1.25, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.25, 0.7, 0.25]} />
          <meshStandardMaterial color={shirtColor} />
        </mesh>
      </group>

      {/* Left leg - pivot at hip */}
      <group ref={leftLegRef} position={[-0.15, 0.5, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.25, 0.7, 0.25]} />
          <meshStandardMaterial color={pantsColor} />
        </mesh>
      </group>

      {/* Right leg - pivot at hip */}
      <group ref={rightLegRef} position={[0.15, 0.5, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.25, 0.7, 0.25]} />
          <meshStandardMaterial color={pantsColor} />
        </mesh>
      </group>
    </group>
  )
}

/** Adjust a hex color by a brightness delta */
function adjustColor(hex: string, delta: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + delta))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + delta))
  const b = Math.min(255, Math.max(0, (num & 0xff) + delta))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export { adjustColor }
