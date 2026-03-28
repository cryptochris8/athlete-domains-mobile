import { useRef, useImperativeHandle, forwardRef, useMemo, useCallback } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody, CylinderCollider, type RapierRigidBody, type CollisionEnterPayload } from '@react-three/rapier'
import { SkeletonUtils } from 'three-stdlib'
import { BOWLING_CONFIG, getPinPositions } from './config'
import { audioManager } from '@/core/AudioManager'
import { useBowling } from './useBowling'

const PIN_MODEL_PATH = '/models/bowling-pin/scene.gltf'
// Model is ~243 units tall (4.86 raw × 50 baked scale). Scale to match pinHeight.
const PIN_MODEL_SCALE = BOWLING_CONFIG.pinHeight / 243

export interface PinsHandle {
  checkKnocked: () => boolean[]
  resetPins: () => void
  resetUnknocked: () => void
}

export const Pins = forwardRef<PinsHandle>(function Pins(_, ref) {
  const pinRefs = useRef<(RapierRigidBody | null)[]>([])
  const positions = useRef(getPinPositions())
  const { scene } = useGLTF(PIN_MODEL_PATH)

  // Throttled pin-to-pin crash sound — plays when pins collide with each other
  const lastPinCrashTime = useRef(0)
  const handlePinCollision = useCallback((_payload: CollisionEnterPayload) => {
    if (useBowling.getState().phase !== 'rolling') return
    const now = performance.now()
    // Throttle to every 200ms — pin chain reactions produce many contacts
    if (now - lastPinCrashTime.current > 200) {
      lastPinCrashTime.current = now
      audioManager.play('pinCrash')
    }
  }, [])

  // Create 10 independent clones of the model
  const clones = useMemo(
    () => Array.from({ length: 10 }, () => SkeletonUtils.clone(scene)),
    [scene],
  )

  useImperativeHandle(ref, () => ({
    checkKnocked: () => {
      return pinRefs.current.map((pinRef) => {
        if (!pinRef) return true
        const rotation = pinRef.rotation()
        // A pin is "knocked" if tilted more than ~30 degrees
        const upDot = Math.abs(
          2 * (rotation.x * rotation.z + rotation.w * rotation.y)
        )
        return upDot > 0.5
      })
    },
    resetPins: () => {
      const pos = positions.current
      pinRefs.current.forEach((pinRef, i) => {
        if (!pinRef) return
        pinRef.setTranslation({ x: pos[i][0], y: pos[i][1], z: pos[i][2] }, true)
        pinRef.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
        pinRef.setLinvel({ x: 0, y: 0, z: 0 }, true)
        pinRef.setAngvel({ x: 0, y: 0, z: 0 }, true)
      })
    },
    resetUnknocked: () => {
      // Keep knocked pins away, reset standing pins
      const pos = positions.current
      pinRefs.current.forEach((pinRef, i) => {
        if (!pinRef) return
        const rotation = pinRef.rotation()
        const upDot = Math.abs(2 * (rotation.x * rotation.z + rotation.w * rotation.y))
        if (upDot <= 0.5) {
          // Still standing - reset to position
          pinRef.setTranslation({ x: pos[i][0], y: pos[i][1], z: pos[i][2] }, true)
          pinRef.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
          pinRef.setLinvel({ x: 0, y: 0, z: 0 }, true)
          pinRef.setAngvel({ x: 0, y: 0, z: 0 }, true)
        } else {
          // Knocked - move out of the way
          pinRef.setTranslation({ x: 5, y: -2, z: pos[i][2] }, true)
          pinRef.setLinvel({ x: 0, y: 0, z: 0 }, true)
          pinRef.setAngvel({ x: 0, y: 0, z: 0 }, true)
        }
      })
    },
  }))

  return (
    <group>
      {positions.current.map((pos, i) => (
        <RigidBody
          key={i}
          ref={(r) => { pinRefs.current[i] = r }}
          position={pos}
          mass={BOWLING_CONFIG.pinMass}
          restitution={BOWLING_CONFIG.pinRestitution}
          colliders={false}
          linearDamping={0.05}
          angularDamping={0.05}
          friction={0.3}
          onCollisionEnter={handlePinCollision}
        >
          <CylinderCollider args={[BOWLING_CONFIG.pinHeight / 2, BOWLING_CONFIG.pinRadius]} />
          {/* GLTF model — origin at bottom, so offset down by half pin height to center on RigidBody */}
          <group scale={PIN_MODEL_SCALE} position={[0, -BOWLING_CONFIG.pinHeight / 2, 0]}>
            <primitive object={clones[i]} />
          </group>
        </RigidBody>
      ))}
    </group>
  )
})

useGLTF.preload(PIN_MODEL_PATH)
