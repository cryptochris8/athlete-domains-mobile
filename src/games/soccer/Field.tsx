import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { SOCCER_CONFIG } from './config'

/** Create a procedural grass texture with mow stripes */
function createGrassTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Base green
  ctx.fillStyle = '#3D8B37'
  ctx.fillRect(0, 0, size, size)

  // Alternating mow stripes (lighter/darker bands)
  const stripeWidth = size / 8
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    ctx.fillRect(0, i * stripeWidth, size, stripeWidth)
  }

  // Subtle noise for grass texture
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,50,0,0.06)'
    ctx.fillRect(x, y, 1.5, 1.5)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 6)
  return tex
}

export function Field() {
  const { fieldWidth, fieldLength } = SOCCER_CONFIG
  const grassTexture = useMemo(() => createGrassTexture(), [])

  return (
    <group>
      {/* Grass field with mow stripes */}
      <RigidBody type="fixed" colliders="cuboid" friction={0.6} restitution={0.3}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[fieldWidth, fieldLength, 0.1]} />
          <meshStandardMaterial map={grassTexture} color="#4CAF50" roughness={0.85} />
        </mesh>
      </RigidBody>

      {/* Penalty spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 2]} receiveShadow>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial color="#fff" />
      </mesh>

      {/* Penalty area lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -4]}>
        <planeGeometry args={[10, 0.05]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {[-5, 5].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.001, -6]}>
          <planeGeometry args={[0.05, 4]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      ))}

      {/* Goal area lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -6]}>
        <planeGeometry args={[6, 0.05]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
    </group>
  )
}
