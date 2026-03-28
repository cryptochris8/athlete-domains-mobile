import { useRef, useEffect, useCallback, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { useBasketball } from './useBasketball'
import { useGameStore } from '@/stores/useGameStore'
import { useMobileStore } from '@/stores/useMobileStore'
import { BASKETBALL_CONFIG } from './config'
import { BallTrail } from '@/components/BallTrail'

const TRAJECTORY_DOT_COUNT = 20
const TRAJECTORY_DURATION = 1.5 // seconds of trajectory to preview

/** Generate a canvas texture with basketball seam lines */
function createBasketballTexture(): THREE.CanvasTexture | null {
  const size = 128 // Reduced from 256 — sufficient for a small ball
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null // WKWebView can return null under memory pressure

  // Base orange
  ctx.fillStyle = '#FF6B00'
  ctx.fillRect(0, 0, size, size)

  // Add subtle pebble noise — reduced from 3000 to 500 for faster init
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
    ctx.fillRect(x, y, 1.5, 1.5)
  }

  // Seam lines
  ctx.strokeStyle = '#222'
  ctx.lineWidth = 2.5

  // Vertical seam (center)
  ctx.beginPath()
  ctx.moveTo(size / 2, 0)
  ctx.lineTo(size / 2, size)
  ctx.stroke()

  // Horizontal seam (center)
  ctx.beginPath()
  ctx.moveTo(0, size / 2)
  ctx.lineTo(size, size / 2)
  ctx.stroke()

  // Curved seams (left and right of vertical)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(size * 0.25, 0)
  ctx.quadraticCurveTo(size * 0.35, size / 2, size * 0.25, size)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(size * 0.75, 0)
  ctx.quadraticCurveTo(size * 0.65, size / 2, size * 0.75, size)
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export function BallAndShooter() {
  const ballRef = useRef<RapierRigidBody>(null)
  const missTimerRef = useRef<number | null>(null)
  const { camera } = useThree()
  const basketballTexture = useMemo(() => createBasketballTexture(), []) // null-safe

  // InstancedMesh for trajectory dots — one draw call for all 20 dots
  const trajDotsRef = useRef<THREE.InstancedMesh>(null)
  const _trajMatrix = useRef(new THREE.Matrix4())
  const _trajPos = useRef(new THREE.Vector3())

  // Cleanup instancedMesh geometry/material on unmount
  useEffect(() => {
    return () => {
      if (trajDotsRef.current) {
        trajDotsRef.current.geometry.dispose()
        ;(trajDotsRef.current.material as THREE.MeshBasicMaterial).dispose()
      }
    }
  }, [])

  // Pre-allocated vectors for smooth camera transitions
  const camTargetPos = useRef(new THREE.Vector3(0, 3.5, 8))
  const camLookAtTarget = useRef(new THREE.Vector3(0, 2.5, -5))

  const {
    isBallFlying,
    isPowerCharging,
    shotsRemaining,
    aimAngle,
    startCharging,
    setPower,
    shoot,
    registerMiss,
    resetBall,
    shotResult,
  } = useBasketball()

  const { ballStartPosition, minPower, maxPower, launchAngle } = BASKETBALL_CONFIG
  const chargeStartTime = useRef(0)

  // Power meter oscillation + trajectory preview
  useFrame(() => {
    if (isPowerCharging) {
      const elapsed = (performance.now() - chargeStartTime.current) / 1000
      const t = elapsed * 3
      // sin starts at 0, rises to 1, so power ramps up from 0%
      const normalizedPower = (Math.sin(t - Math.PI / 2) + 1) / 2
      setPower(minPower + normalizedPower * (maxPower - minPower))

      // Update trajectory preview dots
      const currentPower = useBasketball.getState().power
      const currentAim = useBasketball.getState().aimAngle
      const angleRad = (launchAngle * Math.PI) / 180
      const aimRad = (currentAim * Math.PI) / 180
      const vx = Math.sin(aimRad) * currentPower * 0.3
      const vy = Math.sin(angleRad) * currentPower
      const vz = -Math.cos(aimRad) * Math.cos(angleRad) * currentPower
      const gravity = -9.81

      if (trajDotsRef.current) {
        for (let i = 0; i < TRAJECTORY_DOT_COUNT; i++) {
          const tStep = (i / TRAJECTORY_DOT_COUNT) * TRAJECTORY_DURATION
          _trajPos.current.set(
            ballStartPosition[0] + vx * tStep,
            ballStartPosition[1] + vy * tStep + 0.5 * gravity * tStep * tStep,
            ballStartPosition[2] + vz * tStep,
          )
          _trajMatrix.current.makeTranslation(_trajPos.current.x, _trajPos.current.y, _trajPos.current.z)
          trajDotsRef.current.setMatrixAt(i, _trajMatrix.current)
        }
        trajDotsRef.current.instanceMatrix.needsUpdate = true
        trajDotsRef.current.count = TRAJECTORY_DOT_COUNT
      }
    } else {
      if (trajDotsRef.current) {
        trajDotsRef.current.count = 0
      }
    }

    // Dynamic camera: follow ball during flight, zoom near hoop
    if (isBallFlying && ballRef.current) {
      const pos = ballRef.current.translation()
      const hoopPos = BASKETBALL_CONFIG.hoopPosition
      const distToHoop = Math.sqrt(
        (pos.x - hoopPos[0]) ** 2 + (pos.z - hoopPos[2]) ** 2
      )
      const maxDist = 13
      const proximity = 1 - Math.min(distToHoop / maxDist, 1)

      camTargetPos.current.set(
        pos.x * 0.3,
        Math.max(3, pos.y + 1.5),
        Math.max(2, pos.z + 5 - proximity * 2)
      )
      camLookAtTarget.current.set(pos.x, pos.y, pos.z)
    } else {
      // Return to default shooting position
      camTargetPos.current.set(0, 3.5, 8)
      camLookAtTarget.current.set(0, 2.5, -5)
    }

    camera.position.lerp(camTargetPos.current, 0.05)
    camera.lookAt(camLookAtTarget.current)
  })

  // Mobile shoot button tracking (press-to-charge, release-to-shoot)
  const mobileShootWasHeld = useRef(false)

  // Mobile joystick aiming + shoot in useFrame (every frame, reads store directly)
  useFrame(() => {
    const mobileState = useMobileStore.getState()
    if (!mobileState.isMobile || useGameStore.getState().gamePhase !== 'playing') return

    const bball = useBasketball.getState()

    // Joystick X controls aim angle
    const jx = mobileState.joystickVector.x
    if (jx !== 0 && !bball.isBallFlying) {
      const aimSpeed = 60 // degrees per second at full tilt
      const newAngle = Math.max(-BASKETBALL_CONFIG.maxAimAngle, Math.min(BASKETBALL_CONFIG.maxAimAngle,
        bball.aimAngle + jx * aimSpeed * 0.016))
      bball.setAimAngle(newAngle)
    }

    // Shoot button: press to charge, release to shoot
    if (mobileState.shootHeld && !mobileShootWasHeld.current) {
      if (!bball.isBallFlying && bball.shotsRemaining > 0 && !bball.isPowerCharging) {
        chargeStartTime.current = performance.now()
        startCharging()
      }
    } else if (!mobileState.shootHeld && mobileShootWasHeld.current) {
      if (bball.isPowerCharging) {
        const { power: shotPower, aimAngle: shotAngle } = shoot()
        launchBall(shotPower, shotAngle)
      }
    }
    mobileShootWasHeld.current = mobileState.shootHeld
  })

  // Pointer + keyboard controls (desktop only — mobile uses joystick above)
  useEffect(() => {
    const isMobile = useMobileStore.getState().isMobile

    const handleMouseMove = (e: PointerEvent) => {
      if (isMobile) return
      if (isBallFlying) return
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const angle = x * BASKETBALL_CONFIG.maxAimAngle
      useBasketball.getState().setAimAngle(angle)
    }

    const handleMouseDown = () => {
      if (isMobile) return
      if (useGameStore.getState().gamePhase !== 'playing') return
      if (!isBallFlying && shotsRemaining > 0) {
        chargeStartTime.current = performance.now()
        startCharging()
      }
    }

    const handleMouseUp = () => {
      if (isMobile) return
      if (useGameStore.getState().gamePhase !== 'playing') return
      if (!isPowerCharging) return
      const { power: shotPower, aimAngle: shotAngle } = shoot()
      launchBall(shotPower, shotAngle)
    }

    // Keyboard controls: Arrow keys to aim, Space to charge/shoot
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useGameStore.getState().gamePhase !== 'playing') return
      if (e.code === 'Space') {
        e.preventDefault()
        if (!isBallFlying && shotsRemaining > 0 && !isPowerCharging) {
          chargeStartTime.current = performance.now()
          startCharging()
        }
      }
      if (e.code === 'ArrowLeft' && !isBallFlying) {
        const current = useBasketball.getState().aimAngle
        useBasketball.getState().setAimAngle(Math.max(-BASKETBALL_CONFIG.maxAimAngle, current - 2))
      }
      if (e.code === 'ArrowRight' && !isBallFlying) {
        const current = useBasketball.getState().aimAngle
        useBasketball.getState().setAimAngle(Math.min(BASKETBALL_CONFIG.maxAimAngle, current + 2))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (useGameStore.getState().gamePhase !== 'playing') return
      if (e.code === 'Space' && isPowerCharging) {
        const { power: shotPower, aimAngle: shotAngle } = shoot()
        launchBall(shotPower, shotAngle)
      }
    }

    window.addEventListener('pointermove', handleMouseMove)
    window.addEventListener('pointerdown', handleMouseDown)
    window.addEventListener('pointerup', handleMouseUp)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('pointermove', handleMouseMove)
      window.removeEventListener('pointerdown', handleMouseDown)
      window.removeEventListener('pointerup', handleMouseUp)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isBallFlying, isPowerCharging, shotsRemaining, startCharging, shoot])

  const launchBall = useCallback((shotPower: number, shotAngle: number) => {
    if (!ballRef.current) return

    // Reset ball position
    ballRef.current.setTranslation(
      { x: ballStartPosition[0], y: ballStartPosition[1], z: ballStartPosition[2] },
      true
    )
    ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)

    // Calculate launch velocity
    const angleRad = (launchAngle * Math.PI) / 180
    const aimRad = (shotAngle * Math.PI) / 180

    const vx = Math.sin(aimRad) * shotPower * 0.3
    const vy = Math.sin(angleRad) * shotPower
    const vz = -Math.cos(aimRad) * Math.cos(angleRad) * shotPower

    ballRef.current.setLinvel({ x: vx, y: vy, z: vz }, true)
    // Backspin around X-axis (negative = backward rotation as ball arcs)
    ballRef.current.setAngvel({ x: -8, y: 0, z: 0 }, true)

    // Set miss timer - if ball doesn't score in 4 seconds, it's a miss
    if (missTimerRef.current) clearTimeout(missTimerRef.current)
    missTimerRef.current = window.setTimeout(() => {
      const state = useBasketball.getState()
      if (state.isBallFlying) {
        registerMiss()
        setTimeout(() => resetBallPosition(), 1000)
      }
    }, 4000)
  }, [registerMiss])

  // Reset ball to starting position
  const resetBallPosition = useCallback(() => {
    if (!ballRef.current) return
    ballRef.current.setTranslation(
      { x: ballStartPosition[0], y: ballStartPosition[1], z: ballStartPosition[2] },
      true
    )
    ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    resetBall()
  }, [resetBall, ballStartPosition])

  // When shot result is processed, reset ball after delay
  useEffect(() => {
    if (shotResult && shotResult !== 'miss') {
      if (missTimerRef.current) clearTimeout(missTimerRef.current)
      const timer = setTimeout(resetBallPosition, 1500)
      return () => clearTimeout(timer)
    }
  }, [shotResult, resetBallPosition])

  return (
    <>
      {/* Basketball */}
      <RigidBody
        ref={ballRef}
        colliders="ball"
        mass={BASKETBALL_CONFIG.ballMass}
        restitution={BASKETBALL_CONFIG.ballRestitution}
        linearDamping={0.1}
        position={ballStartPosition}
        name="basketball"
      >
        <mesh castShadow>
          <sphereGeometry args={[BASKETBALL_CONFIG.ballRadius, 16, 16]} />
          <meshStandardMaterial map={basketballTexture} color={basketballTexture ? undefined : '#FF6B00'} roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Ball trail during flight */}
      <BallTrail
        getPosition={() => ballRef.current?.translation() ?? null}
        color="#FF8C42"
        isActive={isBallFlying}
      />

      {/* Aim indicator (when not flying) */}
      {!isBallFlying && (
        <mesh
          position={[
            ballStartPosition[0] + Math.sin((aimAngle * Math.PI) / 180) * 2,
            ballStartPosition[1] + 1,
            ballStartPosition[2] - 2,
          ]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#F7C948" emissive="#F7C948" emissiveIntensity={2} />
        </mesh>
      )}

      {/* Trajectory preview dots (visible during power charging) — single draw call */}
      <instancedMesh ref={trajDotsRef} args={[undefined, undefined, TRAJECTORY_DOT_COUNT]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshBasicMaterial color={0xF7C948} transparent opacity={0.6} />
      </instancedMesh>
    </>
  )
}
