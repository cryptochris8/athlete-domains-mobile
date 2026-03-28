import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RigidBody, type RapierRigidBody, type CollisionEnterPayload } from '@react-three/rapier'
import { useBowling } from './useBowling'
import { BOWLING_CONFIG } from './config'
import { BallTrail } from '@/components/BallTrail'
import { audioManager } from '@/core/AudioManager'
import { useGameStore } from '@/stores/useGameStore'
import { useMobileStore } from '@/stores/useMobileStore'

interface BowlingBallProps {
  onBallStopped: () => void
}

export function BowlingBall({ onBallStopped }: BowlingBallProps) {
  const ballRef = useRef<RapierRigidBody>(null)
  const { camera } = useThree()

  // Guard: only report ball stop ONCE per rolling phase
  const ballStopReported = useRef(false)

  // Throttle pin crash sound — don't spam on multi-pin collisions
  const lastCrashTime = useRef(0)
  const pinHitCount = useRef(0)

  const handleCollision = useCallback((payload: CollisionEnterPayload) => {
    // Only play during rolling phase
    if (useBowling.getState().phase !== 'rolling') return
    // Check if we hit a pin (pins don't have a name, but the lane/walls are "fixed" type)
    const otherBody = payload.other.rigidBody
    if (!otherBody || otherBody.bodyType() === 2) return // skip kinematic (fixed) bodies

    const now = performance.now()
    pinHitCount.current++

    // Play crash sound at most every 150ms to avoid overlapping sounds
    if (now - lastCrashTime.current > 150) {
      lastCrashTime.current = now
      audioManager.play('pinCrash')
    }
  }, [])

  // Pre-allocated vectors for smooth camera
  const camTargetPos = useRef(new THREE.Vector3(0, 2.5, 10))
  const camLookAtTarget = useRef(new THREE.Vector3(0, 0.5, -7))

  const {
    phase,
    bowlerX,
    setBowlerX,
    startCharging,
    setPower,
    startSpinning,
    setSpinAngle,
    release,
  } = useBowling()

  const { ballStartPosition, maxBallSpeed, minBallSpeed, ballRadius } = BOWLING_CONFIG

  // Reset the stop guard and pin hit counter when entering rolling phase
  useEffect(() => {
    if (phase === 'rolling') {
      ballStopReported.current = false
      pinHitCount.current = 0
    }
  }, [phase])

  // Initialize camera
  useEffect(() => {
    camera.position.set(0, 2.5, 10)
    camera.lookAt(0, 0.5, -7)
  }, [camera])

  // Handle ball positioning, power/spin oscillation, stop detection + dynamic camera
  useFrame((state) => {
    if (phase === 'positioning' && ballRef.current) {
      ballRef.current.setTranslation(
        { x: bowlerX, y: ballStartPosition[1], z: ballStartPosition[2] },
        true
      )
      ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }

    // Power meter oscillation
    if (phase === 'charging') {
      const t = state.clock.elapsedTime * 3
      const normalized = (Math.sin(t) + 1) / 2
      setPower(minBallSpeed + normalized * (maxBallSpeed - minBallSpeed))
    }

    // Spin needle oscillation
    if (phase === 'spinning') {
      const t = state.clock.elapsedTime * 5
      setSpinAngle(Math.sin(t) * 3)
    }

    // Check if rolling ball has stopped - ONLY FIRE ONCE
    if (phase === 'rolling' && ballRef.current && !ballStopReported.current) {
      const vel = ballRef.current.linvel()
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
      const pos = ballRef.current.translation()

      // Ball stopped or fell off lane
      if (speed < 0.1 || pos.y < -1 || pos.z < -9) {
        ballStopReported.current = true
        audioManager.stop('bowlRoll')
        onBallStopped()
      }
    }

    // --- DYNAMIC CAMERA ---
    if (phase === 'rolling' && ballRef.current) {
      const pos = ballRef.current.translation()
      // Progress: 0 at start (z=7), 1 at pins (z=-7)
      const progress = Math.max(0, 1 - (pos.z + 7) / 14)

      camTargetPos.current.set(
        0.3 + pos.x * 0.3,           // slight side offset for dramatic angle
        2.5 - progress * 1.2,         // lower camera near pins
        Math.max(pos.z + 3, -5)       // follow behind ball
      )
      camLookAtTarget.current.set(
        pos.x,
        0.2,
        Math.min(pos.z - 2, -7)       // look ahead of ball toward pins
      )
    } else {
      // Return to default behind-bowler view
      camTargetPos.current.set(0, 2.5, 10)
      camLookAtTarget.current.set(0, 0.5, -7)
    }

    camera.position.lerp(camTargetPos.current, 0.05)
    camera.lookAt(camLookAtTarget.current)
  })

  // Mobile controls: joystick for positioning, shoot button to advance phases
  const mobileShootWasHeld = useRef(false)
  useFrame(() => {
    const mobileState = useMobileStore.getState()
    if (!mobileState.isMobile || useGameStore.getState().gamePhase !== 'playing') return

    const bowlState = useBowling.getState()

    // Joystick X controls lane position during positioning phase
    const jx = mobileState.joystickVector.x
    if (jx !== 0 && bowlState.phase === 'positioning') {
      const maxX = BOWLING_CONFIG.laneWidth * 0.45
      const newX = Math.max(-maxX, Math.min(maxX, bowlState.bowlerX + jx * 0.02))
      setBowlerX(newX)
    }

    // Shoot button tap advances phases: positioning→charging→spinning→release
    if (mobileState.shootHeld && !mobileShootWasHeld.current) {
      if (bowlState.phase === 'positioning') {
        startCharging()
      } else if (bowlState.phase === 'charging') {
        startSpinning()
      } else if (bowlState.phase === 'spinning') {
        const { power, spin, bowlerX: bx } = release()
        launchBall(power, spin, bx)
      }
    }
    mobileShootWasHeld.current = mobileState.shootHeld
  })

  // Mouse controls (desktop only)
  useEffect(() => {
    const isMobile = useMobileStore.getState().isMobile
    const handleMouseMove = (e: PointerEvent) => {
      if (isMobile) return
      if (phase === 'positioning') {
        const x = (e.clientX / window.innerWidth - 0.5) * BOWLING_CONFIG.laneWidth * 0.9
        setBowlerX(x)
      }
    }

    const handleMouseDown = () => {
      if (isMobile) return
      if (useGameStore.getState().gamePhase !== 'playing') return
      if (phase === 'positioning') {
        startCharging()
      } else if (phase === 'charging') {
        startSpinning()
      } else if (phase === 'spinning') {
        const { power, spin, bowlerX: bx } = release()
        launchBall(power, spin, bx)
      }
    }

    // Keyboard controls: Arrow keys to position, Space to advance phases
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useGameStore.getState().gamePhase !== 'playing') return
      if (e.code === 'Space') {
        e.preventDefault()
        if (phase === 'positioning') {
          startCharging()
        } else if (phase === 'charging') {
          startSpinning()
        } else if (phase === 'spinning') {
          const { power, spin, bowlerX: bx } = release()
          launchBall(power, spin, bx)
        }
      }
      if (phase === 'positioning') {
        const step = 0.1
        if (e.code === 'ArrowLeft') setBowlerX(Math.max(-BOWLING_CONFIG.laneWidth * 0.45, useBowling.getState().bowlerX - step))
        if (e.code === 'ArrowRight') setBowlerX(Math.min(BOWLING_CONFIG.laneWidth * 0.45, useBowling.getState().bowlerX + step))
      }
    }

    window.addEventListener('pointermove', handleMouseMove)
    window.addEventListener('pointerdown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointermove', handleMouseMove)
      window.removeEventListener('pointerdown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [phase, setBowlerX, startCharging, startSpinning, release])

  const launchBall = useCallback((power: number, spin: number, bx: number) => {
    if (!ballRef.current) return
    ballRef.current.setTranslation(
      { x: bx, y: ballStartPosition[1], z: ballStartPosition[2] },
      true
    )
    ballRef.current.setLinvel({ x: spin * 0.5, y: 0, z: -power }, true)
    ballRef.current.setAngvel({ x: -power * 2, y: spin * 2, z: 0 }, true)
    audioManager.play('bowlRoll')
  }, [ballStartPosition])

  return (
    <>
      <RigidBody
        ref={ballRef}
        colliders="ball"
        mass={BOWLING_CONFIG.ballMass}
        restitution={BOWLING_CONFIG.ballRestitution}
        linearDamping={0.15}
        position={ballStartPosition}
        name="bowlingball"
        onCollisionEnter={handleCollision}
      >
        <mesh castShadow>
          <sphereGeometry args={[ballRadius, 32, 32]} />
          <meshStandardMaterial color="#1A1A2E" roughness={0.2} metalness={0.3} />
        </mesh>
        {/* Finger holes */}
        <mesh position={[0, ballRadius * 0.7, -ballRadius * 0.3]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0.02, ballRadius * 0.7, -ballRadius * 0.15]} rotation={[0.1, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[-0.02, ballRadius * 0.7, -ballRadius * 0.15]} rotation={[0.1, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </RigidBody>

      {/* Ball trail down the lane */}
      <BallTrail
        getPosition={() => ballRef.current?.translation() ?? null}
        color="#4444aa"
        isActive={phase === 'rolling'}
      />
    </>
  )
}
