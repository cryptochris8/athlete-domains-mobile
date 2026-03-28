import { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { useThree, useFrame, type ThreeEvent } from '@react-three/fiber'
import { Skybox } from '@/components/Skybox'
import { useGameStore } from '@/stores/useGameStore'
import { useScoreStore } from '@/stores/useScoreStore'
import { Range } from '@/games/archery/Range'
import { TargetSpawner } from '@/games/archery/TargetSpawner'
import { useArchery } from '@/games/archery/useArchery'
import { ARCHERY_CONFIG, getArcheryConfig } from '@/games/archery/config'
import { FirstPersonBow } from '@/games/archery/FirstPersonBow'
import { ArrowProjectile } from '@/games/archery/ArrowProjectile'
import { ScorePopup } from '@/components/ScorePopup'
import { Confetti } from '@/components/Confetti'
import { ParticleExplosion } from '@/components/ParticleExplosion'
import { ScreenShake } from '@/components/ScreenShake'
import { GameAvatar } from '@/components/GameAvatar'
import type { AnimationState } from '@/components/HytopiaAvatar'
import { useGameScene } from '@/hooks/useGameScene'
import { audioManager } from '@/core/AudioManager'
import { useMobileStore } from '@/stores/useMobileStore'

interface PendingShot {
  type: 'hit' | 'miss'
  points?: number
  position: [number, number, number]
  label?: string
  color?: string
}

interface ActiveArrow {
  id: number
  start: [number, number, number]
  end: [number, number, number]
  hitData: PendingShot
  powerRatio: number
}

function ArcheryGame() {
  const { camera } = useThree()
  const gamePhase = useGameStore((s) => s.gamePhase)
  const selectedDifficulty = useGameStore((s) => s.selectedDifficulty)
  const config = useMemo(() => getArcheryConfig(selectedDifficulty), [selectedDifficulty])
  const addScore = useScoreStore((s) => s.addScore)
  const incrementStreak = useScoreStore((s) => s.incrementStreak)
  const resetStreak = useScoreStore((s) => s.resetStreak)
  const isMobileDevice = useMobileStore((s) => s.isMobile)

  const {
    shotsFired: _shotsFired,
    shotResult,
    decrementTime,
    shoot,
    registerHit,
    registerMiss,
    startCharging,
    setPower,
    releaseShot,
    isPowerCharging,
    resetGame,
  } = useArchery()

  const prevShotsFired = useRef(0)
  const [shakeActive, setShakeActive] = useState(false)
  const [reactionAnim, setReactionAnim] = useState<AnimationState | null>(null)
  const [explosions, setExplosions] = useState<{ id: number; position: [number, number, number]; color: string }[]>([])
  const explosionIdRef = useRef(0)
  const [arrows, setArrows] = useState<ActiveArrow[]>([])
  const arrowIdRef = useRef(0)
  const [shooting, setShooting] = useState(false)
  const pendingShotRef = useRef<PendingShot | null>(null)

  // Compute avatar animation from game state
  const avatarAnimation: AnimationState = reactionAnim ?? 'idle'

  // React to shot results for avatar animation
  useEffect(() => {
    if (!shotResult) return
    if (shotResult === 'hit') {
      setReactionAnim('celebrate')
    } else {
      setReactionAnim('disappointed')
    }
    const timer = setTimeout(() => setReactionAnim(null), 2000)
    return () => clearTimeout(timer)
  }, [shotResult])

  // Position camera to look at the range
  useEffect(() => {
    camera.position.set(...ARCHERY_CONFIG.cameraPosition)
    camera.lookAt(...ARCHERY_CONFIG.cameraLookAt)
  }, [camera])

  const { popups, showConfetti, addPopup, removePopup, triggerConfetti, endGame } = useGameScene('archery', () => {
    resetGame(config.roundTimeSeconds)
    prevShotsFired.current = 0
  })

  // Timer
  useEffect(() => {
    if (gamePhase !== 'playing') return
    const interval = setInterval(() => {
      const expired = decrementTime()
      if (expired) endGame()
    }, 1000)
    return () => clearInterval(interval)
  }, [gamePhase, decrementTime, endGame])

  // Power meter oscillation
  useFrame((state) => {
    if (!isPowerCharging) return
    const t = state.clock.elapsedTime * ARCHERY_CONFIG.chargeSpeed
    const normalized = (Math.sin(t) + 1) / 2
    setPower(ARCHERY_CONFIG.minPower + normalized * (ARCHERY_CONFIG.maxPower - ARCHERY_CONFIG.minPower))
  })

  // PointerDown on canvas → start charging power meter
  // On mobile, canvas taps work natively — the HTMLCanvasElement check already filters UI touches
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (gamePhase !== 'playing') return
      if (!(e.target instanceof HTMLCanvasElement)) return
      startCharging()
    }
    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [gamePhase, startCharging])

  // Target hit — called from Target onPointerUp (target dies on release)
  // Just records the hit info; scoring happens when arrow arrives
  const handleTargetHit = useCallback((points: number, position: [number, number, number], label: string, targetColor: string) => {
    if (gamePhase !== 'playing') return
    pendingShotRef.current = { type: 'hit', points, position, label, color: targetColor }
  }, [gamePhase])

  // Backdrop pointerUp — records miss with release position
  const handleBackdropPointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (gamePhase !== 'playing') return
    if (!useArchery.getState().isPowerCharging) return
    const p = event.point
    pendingShotRef.current = { type: 'miss', position: [p.x, p.y, p.z] }
  }, [gamePhase])

  // Refs for stable access in onComplete callback without stale closures
  const addScoreRef = useRef(addScore)
  addScoreRef.current = addScore
  const incrementStreakRef = useRef(incrementStreak)
  incrementStreakRef.current = incrementStreak
  const resetStreakRef = useRef(resetStreak)
  resetStreakRef.current = resetStreak
  const registerHitRef = useRef(registerHit)
  registerHitRef.current = registerHit
  const registerMissRef = useRef(registerMiss)
  registerMissRef.current = registerMiss
  const addPopupRef = useRef(addPopup)
  addPopupRef.current = addPopup
  const triggerConfettiRef = useRef(triggerConfetti)
  triggerConfettiRef.current = triggerConfetti

  // Called when an arrow projectile arrives at its destination
  const handleArrowArrival = useCallback((arrow: ActiveArrow) => {
    setArrows((prev) => prev.filter((x) => x.id !== arrow.id))

    const { hitData, powerRatio } = arrow

    if (hitData.type === 'hit') {
      const basePoints = hitData.points ?? 1
      const finalMultipliedPoints = Math.max(1, Math.round(basePoints * powerRatio * 2))

      registerHitRef.current(basePoints)
      incrementStreakRef.current()
      audioManager.play('targetHit')

      let finalPoints = finalMultipliedPoints
      const multiplierText = `(${(powerRatio * 2).toFixed(1)}x)`
      let text = `${hitData.label} +${finalMultipliedPoints} ${multiplierText}`
      let color = '#F7C948'

      if (basePoints >= 20) {
        text = `DIAMOND! ${hitData.label} +${finalMultipliedPoints} ${multiplierText}`
        color = '#9B59B6'
        audioManager.playVoice('bullseye')
        triggerConfettiRef.current()
      } else if (basePoints >= 10) {
        text = `BULLSEYE! ${hitData.label} +${finalMultipliedPoints} ${multiplierText}`
        color = '#E74C3C'
        triggerConfettiRef.current()
      } else if (basePoints >= 5) {
        text = `GREAT! ${hitData.label} +${finalMultipliedPoints} ${multiplierText}`
        color = '#F7C948'
      } else if (basePoints >= 3) {
        color = '#2ECC71'
      }

      // Streak bonus — read current streak at arrival time
      const currentStreakNow = useScoreStore.getState().currentStreak
      if (currentStreakNow >= ARCHERY_CONFIG.streakBonusThreshold) {
        finalPoints *= ARCHERY_CONFIG.streakBonusMultiplier
        text += ` x2 STREAK!`
        audioManager.playVoice('streak')
        audioManager.play('crowd')
      }

      addScoreRef.current(finalPoints)

      // Screen shake on big hits (5+ base points)
      if (basePoints >= 5) {
        setShakeActive(true)
        setTimeout(() => setShakeActive(false), 300)
      }

      // Particle explosion at hit position
      const explosionId = explosionIdRef.current++
      setExplosions((prev) => [...prev, { id: explosionId, position: hitData.position, color: hitData.color ?? '#F7C948' }])

      addPopupRef.current(text, hitData.position, color)
    } else {
      // Miss
      registerMissRef.current()
      resetStreakRef.current()
    }
  }, [])

  // Window pointerUp → launch the arrow; scoring deferred to arrival
  // On mobile, this fires on canvas touch-end — which is the intended trigger
  useEffect(() => {
    const handlePointerUp = () => {
      if (!useArchery.getState().isPowerCharging) return
      const pending = pendingShotRef.current
      pendingShotRef.current = null
      const { power } = releaseShot()

      // No valid interaction (released off-screen or on empty space) — cancel
      if (!pending) return

      shoot() // count the shot
      audioManager.play('arrowShoot')

      // Spawn arrow carrying hit data — scoring happens on arrival
      const startPos: [number, number, number] = [
        ARCHERY_CONFIG.cameraPosition[0],
        ARCHERY_CONFIG.cameraPosition[1],
        ARCHERY_CONFIG.cameraPosition[2] - 1,
      ]
      const id = arrowIdRef.current++
      const powerRatio = power / ARCHERY_CONFIG.maxPower
      setArrows((prev) => [...prev, { id, start: startPos, end: pending.position, hitData: pending, powerRatio }])

      setShooting(true)
      setTimeout(() => setShooting(false), 100)
    }

    window.addEventListener('pointerup', handlePointerUp)
    return () => window.removeEventListener('pointerup', handlePointerUp)
  }, [releaseShot, shoot])

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 12, 8]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={isMobileDevice ? 512 : 2048}
        shadow-mapSize-height={isMobileDevice ? 512 : 2048}
      />
      <Skybox scene="archery" />

      <Range />

      {/* Large invisible backdrop plane to catch missed shots on release */}
      <mesh
        position={[0, 4, -20]}
        onPointerUp={handleBackdropPointerUp}
      >
        <planeGeometry args={[60, 40]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <TargetSpawner
        maxTargets={config.maxTargets}
        speedScale={config.targetSpeedScale}
        sizeScale={config.targetSizeScale}
        paused={gamePhase !== 'playing'}
        onTargetHit={handleTargetHit}
      />

      <FirstPersonBow shooting={shooting} />

      {arrows.map((a) => (
        <ArrowProjectile
          key={a.id}
          startPosition={a.start}
          endPosition={a.end}
          onComplete={() => handleArrowArrival(a)}
        />
      ))}

      <GameAvatar position={[-3, 0, 5]} rotationY={0.3} animation={avatarAnimation} showBow />

      {popups.map((popup) => (
        <ScorePopup
          key={popup.id}
          text={popup.text}
          position={popup.position}
          color={popup.color}
          onComplete={() => removePopup(popup.id)}
        />
      ))}

      {explosions.map((e) => (
        <ParticleExplosion
          key={e.id}
          position={e.position}
          color={e.color}
          onComplete={() => setExplosions((prev) => prev.filter((x) => x.id !== e.id))}
        />
      ))}

      {showConfetti && <Confetti position={[0, 3, -5]} />}
      <ScreenShake active={shakeActive} intensity={0.08} duration={0.2} />
    </>
  )
}

export function Archery() {
  return <ArcheryGame />
}
