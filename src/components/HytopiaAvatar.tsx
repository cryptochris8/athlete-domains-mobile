import { useRef, useEffect, useMemo, useCallback } from 'react'
import { useGLTF, useAnimations, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'

const MODEL_PATH = '/models/player.gltf'
const DEFAULT_SKIN = '/skins/player-default.png'

export type AnimationState =
  | 'idle' | 'walk' | 'run' | 'charge' | 'throw'
  | 'kick' | 'swing' | 'celebrate' | 'disappointed'
  | 'jump' | 'sit' | 'interact'

export const ANIMATION_MAP: Record<AnimationState, {
  upper: string; lower: string; loop: boolean; fullBody: boolean
}> = {
  idle: { upper: 'idle-upper', lower: 'idle-lower', loop: true, fullBody: false },
  walk: { upper: 'walk-upper', lower: 'walk-lower', loop: true, fullBody: false },
  run: { upper: 'run-upper', lower: 'run-lower', loop: true, fullBody: false },
  charge: { upper: 'combat-idle', lower: 'combat-idle', loop: true, fullBody: true },
  throw: { upper: 'bow-draw-shoot', lower: 'bow-draw-shoot', loop: false, fullBody: true },
  kick: { upper: 'sword-attack-1', lower: 'sword-attack-1', loop: false, fullBody: true },
  swing: { upper: 'sword-attack-upper', lower: 'sword-attack-upper', loop: false, fullBody: true },
  celebrate: { upper: 'emote-griddy', lower: 'emote-griddy', loop: false, fullBody: true },
  disappointed: { upper: 'emote-annoyed', lower: 'emote-annoyed', loop: false, fullBody: true },
  jump: { upper: 'jump-pre', lower: 'jump-pre', loop: false, fullBody: true },
  sit: { upper: 'sit-chair', lower: 'sit-chair', loop: true, fullBody: true },
  interact: { upper: 'simple-interact', lower: 'simple-interact', loop: false, fullBody: true },
}

/** Get animation config for a given state, with fallback to idle */
export function getAnimationConfig(state: AnimationState) {
  return ANIMATION_MAP[state] ?? ANIMATION_MAP.idle
}

interface HytopiaAvatarProps {
  skinUrl?: string
  animation?: AnimationState
  scale?: number
}

/** Configure a texture for pixel-art character rendering */
export function configureAvatarTexture(texture: THREE.Texture): void {
  texture.flipY = false
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
}

/** Apply a texture to all meshes in a model scene graph */
export function applyTextureToModel(model: THREE.Object3D, texture: THREE.Texture): void {
  model.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat.isMeshStandardMaterial) {
        mat.map = texture
        mat.needsUpdate = true
      }
    }
  })
}

/**
 * Hytopia-style avatar loaded from player.gltf.
 *
 * Features:
 * - 74 pre-made animations (idle, walk, run, jump, combat, emotes)
 * - Skin texture swapping via skinUrl prop (256x256 Hytopia format)
 * - Proper articulated skeleton with named bones
 */
export function HytopiaAvatar({
  skinUrl = DEFAULT_SKIN,
  animation = 'idle',
  scale = 1,
}: HytopiaAvatarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(MODEL_PATH)
  const prevAnimRef = useRef<AnimationState>(animation)
  const activeUpperRef = useRef<string | null>(null)
  const activeLowerRef = useRef<string | null>(null)

  // Clone scene per instance with unique materials so skins don't conflict
  const clone = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene)
    cloned.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        // Clone material so each instance can have its own texture
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone()
        }
      }
    })
    return cloned
  }, [scene])

  // Dispose cloned materials/geometries on unmount to prevent memory leaks
  const disposeClone = useCallback(() => {
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
  }, [clone])

  useEffect(() => {
    return () => disposeClone()
  }, [disposeClone])

  // Load and apply skin texture
  const skinTexture = useTexture(skinUrl)

  useEffect(() => {
    configureAvatarTexture(skinTexture)
    applyTextureToModel(clone, skinTexture)
  }, [clone, skinTexture])

  // Set up animation mixer
  const { actions } = useAnimations(animations, groupRef)

  // Start idle animation on mount
  useEffect(() => {
    const config = getAnimationConfig('idle')
    const upper = actions[config.upper]
    const lower = actions[config.lower]
    upper?.reset().play()
    if (!config.fullBody) lower?.reset().play()
    activeUpperRef.current = config.upper
    activeLowerRef.current = config.fullBody ? null : config.lower
  }, [actions])

  // Transition between animations
  useEffect(() => {
    if (animation === prevAnimRef.current) return
    prevAnimRef.current = animation

    const fadeDuration = 0.2
    const config = getAnimationConfig(animation)

    // Fade out only the currently-playing actions (avoids iterating all 74)
    const prevUpper = activeUpperRef.current
    if (prevUpper && actions[prevUpper]) {
      actions[prevUpper]!.fadeOut(fadeDuration)
    }
    const prevLower = activeLowerRef.current
    if (prevLower && actions[prevLower]) {
      actions[prevLower]!.fadeOut(fadeDuration)
    }

    // Fade in new animations
    const upper = actions[config.upper]
    const lower = actions[config.lower]

    if (upper) {
      upper.reset()
      if (!config.loop) {
        upper.setLoop(THREE.LoopOnce, 1)
        upper.clampWhenFinished = true
      } else {
        upper.setLoop(THREE.LoopRepeat, Infinity)
      }
      upper.fadeIn(fadeDuration).play()
    }

    if (!config.fullBody && lower && lower !== upper) {
      lower.reset()
      if (!config.loop) {
        lower.setLoop(THREE.LoopOnce, 1)
        lower.clampWhenFinished = true
      } else {
        lower.setLoop(THREE.LoopRepeat, Infinity)
      }
      lower.fadeIn(fadeDuration).play()
    }

    // Track the newly-active action names for the next transition
    activeUpperRef.current = config.upper
    activeLowerRef.current = config.fullBody ? null : config.lower
  }, [animation, actions])

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clone} />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
