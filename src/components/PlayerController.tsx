import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useMouseLook } from '@/hooks/useMouseLook'
import { HytopiaAvatar, type AnimationState } from './HytopiaAvatar'
import { HUB } from '@/core/constants'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useMobileStore, MOBILE_CONFIG } from '@/stores/useMobileStore'
import { getAvatarSkin } from './GameAvatar'
import type { ControlScheme } from '@/types'

/** Pure function: compute movement direction from pressed keys */
export function calculateMoveDirection(keys: Set<string>, scheme: ControlScheme = 'wasd', out?: THREE.Vector3): THREE.Vector3 {
  const dir = out ? out.set(0, 0, 0) : new THREE.Vector3()
  if (scheme === 'wasd') {
    if (keys.has('KeyW') || keys.has('ArrowUp')) dir.z -= 1
    if (keys.has('KeyS') || keys.has('ArrowDown')) dir.z += 1
    if (keys.has('KeyA') || keys.has('ArrowLeft')) dir.x -= 1
    if (keys.has('KeyD') || keys.has('ArrowRight')) dir.x += 1
  } else {
    if (keys.has('ArrowUp')) dir.z -= 1
    if (keys.has('ArrowDown')) dir.z += 1
    if (keys.has('ArrowLeft')) dir.x -= 1
    if (keys.has('ArrowRight')) dir.x += 1
  }
  if (dir.lengthSq() > 0) dir.normalize()
  return dir
}

/** Pure function: check if sprint key is held */
export function isSprinting(keys: Set<string>, scheme: ControlScheme = 'wasd'): boolean {
  if (scheme === 'wasd') return keys.has('ShiftLeft') || keys.has('ShiftRight')
  return keys.has('Numpad0')
}

/** Pure function: check if shoot key is pressed */
export function isShootKey(keys: Set<string>, scheme: ControlScheme = 'wasd'): boolean {
  if (scheme === 'wasd') return keys.has('Space')
  return keys.has('Numpad1')
}

/** Pure function: check if pass key is pressed */
export function isPassKey(keys: Set<string>, scheme: ControlScheme = 'wasd'): boolean {
  if (scheme === 'wasd') return keys.has('KeyE')
  return keys.has('Numpad2')
}

/** Pure function: clamp position within world bounds */
export function clampToWorld(pos: THREE.Vector3, halfSize: number, out?: THREE.Vector3): THREE.Vector3 {
  const result = out || new THREE.Vector3()
  return result.set(
    Math.max(-halfSize, Math.min(halfSize, pos.x)),
    pos.y,
    Math.max(-halfSize, Math.min(halfSize, pos.z)),
  )
}

/** Pure function: calculate camera position given player position and offset */
export function calculateCameraPosition(
  playerPos: THREE.Vector3,
  offset: [number, number, number],
  out?: THREE.Vector3,
): THREE.Vector3 {
  const result = out || new THREE.Vector3()
  return result.set(
    playerPos.x + offset[0],
    playerPos.y + offset[1],
    playerPos.z + offset[2],
  )
}

export function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return a + diff * t
}

/** Pure function: rotate movement vector by camera yaw so WASD is camera-relative */
export function rotateMovementByCamera(moveDir: THREE.Vector3, cameraYaw: number, out?: THREE.Vector3): THREE.Vector3 {
  if (moveDir.lengthSq() === 0) return out ? out.copy(moveDir) : moveDir.clone()
  const cos = Math.cos(cameraYaw)
  const sin = Math.sin(cameraYaw)
  const result = out || new THREE.Vector3()
  return result.set(
    moveDir.x * cos - moveDir.z * sin,
    0,
    moveDir.x * sin + moveDir.z * cos,
  )
}

/** Pure function: check if jump key is pressed */
export function isJumpPressed(keys: Set<string>): boolean {
  return keys.has('Space')
}

/** Pure function: compute new vertical velocity after applying gravity for one frame */
export function applyGravity(verticalVelocity: number, gravity: number, delta: number): number {
  return verticalVelocity - gravity * delta
}

/** Pure function: compute jump result — new Y position, velocity, and grounded state */
export function computeJump(
  currentY: number,
  verticalVelocity: number,
  gravity: number,
  groundY: number,
  delta: number,
): { y: number; velocity: number; grounded: boolean } {
  const newVelocity = applyGravity(verticalVelocity, gravity, delta)
  const newY = currentY + newVelocity * delta

  if (newY <= groundY) {
    return { y: groundY, velocity: 0, grounded: true }
  }
  return { y: newY, velocity: newVelocity, grounded: false }
}

/** Pure function: get the forward direction the camera is facing (yaw only, XZ plane) */
export function getCameraYawForward(cameraYaw: number): number {
  // Camera looks from orbit position toward player center.
  // The "forward" direction for movement is the opposite of the camera's orbit angle.
  // When yaw=0, camera is behind player (+Z), forward is -Z → angle 0
  return Math.atan2(Math.sin(cameraYaw), Math.cos(cameraYaw)) + Math.PI
}

interface PlayerControllerProps {
  onPositionChange?: (pos: THREE.Vector3, rotation: number, animationState: AnimationState) => void
}

export function PlayerController({ onPositionChange }: PlayerControllerProps) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const avatarGroupRef = useRef<THREE.Group>(null)
  const keys = useKeyboard()
  const { camera } = useThree()
  const currentFacing = useRef(0)
  const [movementState, setMovementState] = useState<AnimationState>('idle')
  const animation: AnimationState = movementState
  const isFirstFrame = useRef(true)
  const verticalVelocity = useRef(0)
  const isGrounded = useRef(true)
  const { yaw, pitch } = useMouseLook()
  const skinId = usePlayerStore((s) => {
    const profile = s.profiles.find((p) => p.id === s.activeProfileId)
    return profile?.skinId
  })
  const skinUrl = getAvatarSkin(skinId)

  // Pre-allocated scratch vectors to avoid per-frame allocations
  const _rawDir = useRef(new THREE.Vector3())
  const _moveDir = useRef(new THREE.Vector3())
  const _pos = useRef(new THREE.Vector3())
  const _newPos = useRef(new THREE.Vector3())
  const _clamped = useRef(new THREE.Vector3())
  const _camTarget = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    if (!bodyRef.current) return

    // Merge keyboard and mobile joystick input
    const mobileState = useMobileStore.getState()
    const rawDir = calculateMoveDirection(keys.current, 'wasd', _rawDir.current)

    // If joystick has input, use it instead of keyboard
    const jx = mobileState.joystickVector.x
    const jy = mobileState.joystickVector.y
    const joystickActive = jx !== 0 || jy !== 0
    if (joystickActive) {
      rawDir.set(jx, 0, -jy)
      if (rawDir.lengthSq() > 0) rawDir.normalize()
    }

    // Negate yaw so W always moves AWAY from camera (camera-to-player direction)
    const moveDir = rotateMovementByCamera(rawDir, -yaw.current, _moveDir.current)
    const moving = moveDir.lengthSq() > 0
    // Mobile: joystick force > 0.75 = run, below = walk. Desktop: Shift = run.
    const sprinting = moving && (isSprinting(keys.current) || (joystickActive && mobileState.joystickForce >= MOBILE_CONFIG.sprintForceThreshold))

    // Jump: trigger on Space or mobile jump button when grounded
    if ((isJumpPressed(keys.current) || mobileState.consumeJump()) && isGrounded.current) {
      verticalVelocity.current = HUB.jumpVelocity
      isGrounded.current = false
    }

    // Apply jump/gravity physics
    const currentPos = bodyRef.current.translation()
    const jumpResult = computeJump(
      currentPos.y, verticalVelocity.current, HUB.gravity, HUB.groundY, delta,
    )
    verticalVelocity.current = jumpResult.velocity
    isGrounded.current = jumpResult.grounded

    // Determine animation state: jump overrides walk/run
    const newState: AnimationState = !isGrounded.current
      ? 'jump'
      : moving ? (sprinting ? 'run' : 'walk') : 'idle'
    if (newState !== movementState) setMovementState(newState)

    const pos = _pos.current.set(currentPos.x, jumpResult.y, currentPos.z)

    if (moving) {
      const speed = sprinting ? HUB.playerSpeed * HUB.sprintMultiplier : HUB.playerSpeed
      const vx = moveDir.x * speed * delta
      const vz = moveDir.z * speed * delta
      _newPos.current.set(pos.x + vx, pos.y, pos.z + vz)
      const clamped = clampToWorld(_newPos.current, HUB.worldSize / 2 - 1, _clamped.current)
      bodyRef.current.setNextKinematicTranslation({ x: clamped.x, y: clamped.y, z: clamped.z })

      // Minecraft-style: face movement direction instantly.
      // Mouse steers via yaw → movement direction changes → model snaps to match.
      const targetAngle = Math.atan2(-moveDir.x, -moveDir.z)
      currentFacing.current = targetAngle

      if (avatarGroupRef.current) {
        avatarGroupRef.current.rotation.y = currentFacing.current
      }

      pos.copy(clamped)
    } else {
      // Still update position for jump/gravity when not moving horizontally
      bodyRef.current.setNextKinematicTranslation({ x: pos.x, y: pos.y, z: pos.z })

      // When idle, slowly align character to face camera forward direction
      // This ensures pressing W immediately moves where camera points
      const cameraForwardAngle = yaw.current
      currentFacing.current = lerpAngle(currentFacing.current, cameraForwardAngle, HUB.idleFacingLerpSpeed)

      if (avatarGroupRef.current) {
        avatarGroupRef.current.rotation.y = currentFacing.current
      }
    }

    // Camera follows behind player — locked to yaw angle
    const d = HUB.cameraDistance
    const p = pitch.current
    const y = yaw.current
    const camX = pos.x + d * Math.sin(y) * Math.cos(p)
    const camY = pos.y + d * Math.sin(p)
    const camZ = pos.z + d * Math.cos(y) * Math.cos(p)
    const camTarget = _camTarget.current.set(camX, camY, camZ)

    // Tighter camera follow when moving for responsive steering
    const camLerp = moving ? HUB.movingCameraLerpSpeed : HUB.cameraLerpSpeed

    if (isFirstFrame.current) {
      camera.position.copy(camTarget)
      isFirstFrame.current = false
    } else {
      camera.position.lerp(camTarget, camLerp)
    }
    camera.lookAt(pos.x, pos.y + HUB.cameraHeightOffset, pos.z)

    onPositionChange?.(pos, currentFacing.current, movementState)
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      position={[0, 0, 0]}
      colliders={false}
    >
      <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.8, 0]} />
      <group ref={avatarGroupRef}>
        <HytopiaAvatar key={skinUrl} skinUrl={skinUrl} animation={animation} />
      </group>
    </RigidBody>
  )
}
