import { useRef, Suspense, useState, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { HytopiaAvatar } from '@/components/HytopiaAvatar'
import type { AnimationState } from '@/components/HytopiaAvatar'
import { DEFENDER_CONFIG, type DefenderLane } from './config'

export interface DefenderHandle {
  getPosition: () => [number, number, number]
  triggerCelebrate: () => void
}

interface DefenderBlockerProps {
  lane: DefenderLane
  paused: boolean
}

export const DefenderBlocker = forwardRef<DefenderHandle, DefenderBlockerProps>(
  function DefenderBlocker({ lane, paused }, ref) {
    const groupRef = useRef<Group>(null)
    const posX = useRef(lane.direction === 1 ? -DEFENDER_CONFIG.patrolWidth : DEFENDER_CONFIG.patrolWidth)
    const dir = useRef(lane.direction)
    const [animation, setAnimation] = useState<AnimationState>('charge')
    const celebrateTimer = useRef<number | null>(null)

    // Juke AI state
    const jukeTimer = useRef(1.5 + Math.random() * 2) // time until next juke
    const speedMult = useRef(1.0) // current speed multiplier
    const pauseTimer = useRef(0) // brief hesitation

    useImperativeHandle(ref, () => ({
      getPosition: () => [posX.current, 0, lane.z],
      triggerCelebrate: () => {
        setAnimation('celebrate')
        celebrateTimer.current = DEFENDER_CONFIG.celebrateDuration
      },
    }))

    useFrame((_, delta) => {
      if (!groupRef.current || paused) return

      // If celebrating after an interception, count down then resume patrol
      if (celebrateTimer.current !== null) {
        celebrateTimer.current -= delta
        if (celebrateTimer.current <= 0) {
          celebrateTimer.current = null
          setAnimation('charge')
        }
        return
      }

      // Brief pause (fake-out hesitation)
      if (pauseTimer.current > 0) {
        pauseTimer.current -= delta
        return
      }

      // Juke timer — randomly change behavior
      jukeTimer.current -= delta
      if (jukeTimer.current <= 0) {
        const roll = Math.random()
        if (roll < 0.3) {
          // Sudden direction change
          dir.current = dir.current === 1 ? -1 : 1
          speedMult.current = 1.2 + Math.random() * 0.8 // burst speed
        } else if (roll < 0.5) {
          // Brief hesitation then burst
          pauseTimer.current = 0.15 + Math.random() * 0.25
          speedMult.current = 1.5
        } else if (roll < 0.7) {
          // Speed burst in same direction
          speedMult.current = 1.5 + Math.random() * 0.5
        } else {
          // Return to normal speed
          speedMult.current = 0.7 + Math.random() * 0.6
        }
        jukeTimer.current = 0.8 + Math.random() * 2.0
      }

      // Gradually normalize speed multiplier
      speedMult.current += (1.0 - speedMult.current) * delta * 2

      posX.current += dir.current * lane.speed * speedMult.current * delta

      // Bounce at patrol boundaries
      if (posX.current > DEFENDER_CONFIG.patrolWidth) {
        posX.current = DEFENDER_CONFIG.patrolWidth
        dir.current = -1
      } else if (posX.current < -DEFENDER_CONFIG.patrolWidth) {
        posX.current = -DEFENDER_CONFIG.patrolWidth
        dir.current = 1
      }

      groupRef.current.position.x = posX.current
      groupRef.current.position.y = 0
      groupRef.current.position.z = lane.z
    })

    return (
      <group ref={groupRef} position={[posX.current, 0, lane.z]}>
        <Suspense fallback={
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.8, 1.8, 0.8]} />
            <meshStandardMaterial color="#E74C3C" />
          </mesh>
        }>
          {/* Face toward camera (player) */}
          <group rotation={[0, Math.PI, 0]}>
            <HytopiaAvatar
              skinUrl={lane.skinUrl}
              animation={animation}
              scale={DEFENDER_CONFIG.scale}
            />
          </group>
        </Suspense>

        {/* Red glow ring on ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.6, 1.0, 24]} />
          <meshStandardMaterial
            color="#E74C3C"
            emissive="#E74C3C"
            emissiveIntensity={0.6}
            transparent
            opacity={0.4}
            side={2}
          />
        </mesh>
      </group>
    )
  }
)
