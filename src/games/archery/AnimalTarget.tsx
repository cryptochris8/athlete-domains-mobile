import { useRef, useMemo, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { TARGET_TYPES } from './config'

interface AnimalTargetProps {
  modelPath: string
  scale: number
  color: string
  direction: number
  runAnim: string
}

/**
 * Renders a cloned Hytopia NPC model with a running/walking animation.
 * Uses SkeletonUtils.clone() for proper multi-instance skinned meshes.
 * Applies pixel-art texture settings (NearestFilter, no mipmaps).
 */
export function AnimalTarget({ modelPath, scale, color, direction, runAnim }: AnimalTargetProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(modelPath)

  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(scene)
    c.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh
        mesh.castShadow = true
        // Clone material and apply pixel-art texture settings
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
          if (mat.map) {
            mat.map = mat.map.clone()
            mat.map.magFilter = THREE.NearestFilter
            mat.map.minFilter = THREE.NearestFilter
            mat.map.generateMipmaps = false
            mat.map.needsUpdate = true
          }
          mat.emissive = new THREE.Color(color)
          mat.emissiveIntensity = 0.1
          mesh.material = mat
        }
      }
    })
    return c
  }, [scene, color])

  const { actions, names } = useAnimations(animations, groupRef)

  useEffect(() => {
    // Use the specified run animation, fall back through common names
    const trimmedRunAnim = runAnim.trim()
    const candidates = [trimmedRunAnim, 'run', 'walk', 'fly', 'hop']
    let animName: string | undefined
    for (const c of candidates) {
      const found = names.find((n) => n.toLowerCase() === c.toLowerCase())
      if (found) {
        animName = found
        break
      }
    }
    if (!animName && names.length > 0) animName = names[0]

    if (animName && actions[animName]) {
      actions[animName]!.reset().setEffectiveTimeScale(1.0).play()
    }
    return () => {
      if (animName && actions[animName]) {
        actions[animName]!.stop()
      }
    }
  }, [actions, names, runAnim])

  // Face the direction of movement
  const rotationY = direction === 1 ? -Math.PI / 2 : Math.PI / 2

  return (
    <group ref={groupRef}>
      <primitive object={clone} scale={scale} rotation={[0, rotationY, 0]} />
    </group>
  )
}

// Preload all archery target models
TARGET_TYPES.forEach((t) => useGLTF.preload(t.model))
