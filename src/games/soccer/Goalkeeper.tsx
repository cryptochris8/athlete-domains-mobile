import { useRef, useEffect, Suspense } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier'
import { SOCCER_CONFIG, KEEPER_DIFFICULTY } from './config'
import { HytopiaAvatar } from '@/components/HytopiaAvatar'
import type { Difficulty } from '@/types'

const GOALKEEPER_SKIN = '/skins/goalkeeper.png'

interface GoalkeeperProps {
  difficulty: Difficulty
  ballAimX: number
  ballAimY: number
  isBallKicked: boolean
  isSlowed: boolean
}

export function Goalkeeper({ difficulty, ballAimX, ballAimY, isBallKicked, isSlowed }: GoalkeeperProps) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const meshGroupRef = useRef<THREE.Group>(null!)
  const targetX = useRef(0)
  const targetY = useRef(SOCCER_CONFIG.keeperStartPosition[1])
  const hasDived = useRef(false)
  const diveTimer = useRef<number | null>(null)

  const keeperSettings = KEEPER_DIFFICULTY[difficulty]
  const effectiveSpeed = isSlowed ? keeperSettings.diveSpeed * 0.5 : keeperSettings.diveSpeed

  // Reset on new kick
  useEffect(() => {
    if (!isBallKicked) {
      hasDived.current = false
      targetX.current = 0
      targetY.current = SOCCER_CONFIG.keeperStartPosition[1]
      if (bodyRef.current) {
        const [sx, sy, sz] = SOCCER_CONFIG.keeperStartPosition
        bodyRef.current.setNextKinematicTranslation({ x: sx, y: sy, z: sz })
      }
      if (diveTimer.current) {
        clearTimeout(diveTimer.current)
        diveTimer.current = null
      }
    }
  }, [isBallKicked])

  // Decide where to dive when ball is kicked
  useEffect(() => {
    if (isBallKicked && !hasDived.current) {
      hasDived.current = true
      const delay = isSlowed ? keeperSettings.reactionDelayMs * 2 : keeperSettings.reactionDelayMs

      diveTimer.current = window.setTimeout(() => {
        // Keeper guesses based on accuracy
        if (Math.random() < keeperSettings.accuracy) {
          // Correct guess - dive towards ball
          targetX.current = ballAimX * 0.85
          targetY.current = Math.max(0.5, ballAimY * 0.8)
        } else {
          // Wrong guess - dive the other way
          targetX.current = -ballAimX * 0.7 + (Math.random() - 0.5) * 2
          targetY.current = Math.random() * SOCCER_CONFIG.goalHeight * 0.6
        }
      }, delay)
    }
  }, [isBallKicked, ballAimX, ballAimY, keeperSettings, isSlowed])

  useFrame((state, delta) => {
    if (!bodyRef.current) return
    const pos = bodyRef.current.translation()

    if (isBallKicked && hasDived.current) {
      // Move towards target using setNextKinematicTranslation for proper collision
      const dx = targetX.current - pos.x
      const dy = targetY.current - pos.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > 0.1) {
        const speed = effectiveSpeed * delta
        bodyRef.current.setNextKinematicTranslation({
          x: pos.x + (dx / dist) * speed * 10,
          y: Math.max(0.5, pos.y + (dy / dist) * speed * 5),
          z: pos.z,
        })
      }

      // Visual dive tilt: lean toward dive direction
      if (meshGroupRef.current) {
        const tilt = Math.sign(targetX.current - pos.x) * Math.min(Math.abs(targetX.current - pos.x) * 0.15, 0.52)
        meshGroupRef.current.rotation.z = THREE.MathUtils.lerp(meshGroupRef.current.rotation.z, tilt, 0.1)
      }
    } else if (!isBallKicked) {
      // Idle sway — always lerp back to start Y/Z so the keeper doesn't
      // stay stuck at the dive height after a goal is scored.
      const [_startX, startY, startZ] = SOCCER_CONFIG.keeperStartPosition
      const sway = Math.sin(state.clock.elapsedTime * 2) * 0.3
      bodyRef.current.setNextKinematicTranslation({
        x: sway,
        y: THREE.MathUtils.lerp(pos.y, startY, 0.15),
        z: startZ,
      })

      // Reset visual rotation when idle
      if (meshGroupRef.current) {
        meshGroupRef.current.rotation.z = THREE.MathUtils.lerp(meshGroupRef.current.rotation.z, 0, 0.1)
      }
    }
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      position={SOCCER_CONFIG.keeperStartPosition}
      colliders={false}
    >
      <CuboidCollider
        args={[SOCCER_CONFIG.keeperWidth / 2, SOCCER_CONFIG.keeperHeight / 2, SOCCER_CONFIG.keeperDepth / 2]}
        position={[0, 0, 0]}
      />
      <group ref={meshGroupRef}>
        {/* Offset avatar down and rotate 180° to face the shooter (+Z) */}
        <group position={[0, -SOCCER_CONFIG.keeperHeight / 2, 0]} rotation={[0, Math.PI, 0]}>
          <Suspense fallback={null}>
            <HytopiaAvatar skinUrl={GOALKEEPER_SKIN} scale={1} />
          </Suspense>
        </group>
      </group>
    </RigidBody>
  )
}
