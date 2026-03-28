import { Suspense, useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { HytopiaAvatar, type AnimationState } from '@/components/HytopiaAvatar'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { LEGACY_SKIN_MAP, DEFAULT_SKIN_ID } from '@/core/constants'

/** Get avatar skin URL for a given skinId (edition number), with legacy fallback */
export function getAvatarSkin(skinId?: number): string {
  const id = skinId ?? DEFAULT_SKIN_ID
  // Legacy skinIds 1-10 map to specific edition numbers
  if (id >= 1 && id <= 10) {
    const edition = LEGACY_SKIN_MAP[id] ?? 1
    return `/skins/avatars/${edition}.png`
  }
  // Direct edition number
  if (id >= 1 && id <= 3000) {
    return `/skins/avatars/${id}.png`
  }
  // Fallback
  return '/skins/avatars/1.png'
}

interface GameAvatarProps {
  position: [number, number, number]
  rotationY: number
  scale?: number
  animation?: AnimationState
  showBow?: boolean
}

/**
 * In-game avatar that renders a HytopiaAvatar with the active player's skin.
 * Pure visual — no physics body or collider.
 */
export function GameAvatar({ position, rotationY, scale = 1, animation, showBow = false }: GameAvatarProps) {
  const skinId = usePlayerStore((s) => {
    const profile = s.profiles.find((p) => p.id === s.activeProfileId)
    return profile?.skinId
  })

  const skinUrl = getAvatarSkin(skinId)

  return (
    <Suspense fallback={null}>
      <group position={position} rotation={[0, rotationY, 0]}>
        <HytopiaAvatar key={skinUrl} skinUrl={skinUrl} animation={animation} scale={scale} />
        {showBow && <AvatarBow />}
      </group>
    </Suspense>
  )
}

/** Small bow model positioned near the avatar's right hand */
function AvatarBow() {
  const { scene } = useGLTF('/models/bow/scene.gltf')
  const clone = useMemo(() => scene.clone(), [scene])

  useEffect(() => {
    return () => {
      clone.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh
          mesh.geometry?.dispose()
          if (mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial
            mat.map?.dispose()
            mat.dispose()
          }
        }
      })
    }
  }, [clone])

  return (
    <primitive
      object={clone}
      position={[0.3, 0.8, 0.1]}
      rotation={[0, Math.PI / 2, -Math.PI / 6]}
      scale={0.08}
    />
  )
}