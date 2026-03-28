import { useEffect, useCallback, useRef, useState, useMemo, createRef } from 'react'
import { useThree, useFrame, type ThreeEvent } from '@react-three/fiber'
import { Skybox } from '@/components/Skybox'
import { useGameStore } from '@/stores/useGameStore'
import { useScoreStore } from '@/stores/useScoreStore'
import { Field } from '@/games/football/Field'
import { FootballTargetSpawner } from '@/games/football/TargetSpawner'
import { useFootball } from '@/games/football/useFootball'
import { FOOTBALL_CONFIG, getFootballConfig, getFootballDefenders, DEFENDER_CONFIG } from '@/games/football/config'
import { FootballProjectile } from '@/games/football/FootballProjectile'
import { DefenderBlocker, type DefenderHandle } from '@/games/football/DefenderBlocker'
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

interface ActiveFootball {
  id: number
  start: [number, number, number]
  end: [number, number, number]
  hitData: PendingShot
  powerRatio: number
}

function FootballGame() {
  const { camera } = useThree()
  const gamePhase = useGameStore((s) => s.gamePhase)
  const selectedDifficulty = useGameStore((s) => s.selectedDifficulty)
  const config = useMemo(() => getFootballConfig(selectedDifficulty), [selectedDifficulty])
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
    registerInterception,
    startCharging,
    setPower,
    releaseShot,
    isPowerCharging,
    resetGame,
  } = useFootball()

  // Defenders
  const defenderLanes = useMemo(() => getFootballDefenders(selectedDifficulty), [selectedDifficulty])
  const defenderRefs = useMemo(
    () => defenderLanes.map(() => createRef<DefenderHandle>()),
    [defenderLanes]
  )

  const prevShotsFired = useRef(0)
  const [shakeActive, setShakeActive] = useState(false)
  const [reactionAnim, setReactionAnim] = useState<AnimationState | null>(null)
  const [explosions, setExplosions] = useState<{ id: number; position: [number, number, number]; color: string }[]>([])
  const explosionIdRef = useRef(0)
  const [footballs, setFootballs] = useState<ActiveFootball[]>([])
  const footballIdRef = useRef(0)
  const [_throwing, setThrowing] = useState(false)
  const pendingShotRef = useRef<PendingShot | null>(null)

  // Compute avatar animation from game state
  const avatarAnimation: AnimationState = reactionAnim ?? 'idle'

  // React to shot results for avatar animation
  useEffect(() => {
    if (!shotResult) return
    if (shotResult === 'hit') {
      setReactionAnim('celebrate')
    } else {
      // Both 'miss' and 'interception' show disappointed
      setReactionAnim('disappointed')
    }
    const timer = setTimeout(() => setReactionAnim(null), 2000)
    return () => clearTimeout(timer)
  }, [shotResult])

  // Position camera to look at the field
  useEffect(() => {
    camera.position.set(...FOOTBALL_CONFIG.cameraPosition)
    camera.lookAt(...FOOTBALL_CONFIG.cameraLookAt)
  }, [camera])

  const { popups, showConfetti, addPopup, removePopup, triggerConfetti, endGame } = useGameScene('football', () => {
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
    const t = state.clock.elapsedTime * FOOTBALL_CONFIG.chargeSpeed
    const normalized = (Math.sin(t) + 1) / 2
    setPower(FOOTBALL_CONFIG.minPower + normalized * (FOOTBALL_CONFIG.maxPower - FOOTBALL_CONFIG.minPower))
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
  // Just records the hit info; scoring happens when football arrives
  const handleTargetHit = useCallback((points: number, position: [number, number, number], label: string, targetColor: string) => {
    if (gamePhase !== 'playing') return
    pendingShotRef.current = { type: 'hit', points, position, label, color: targetColor }
  }, [gamePhase])

  // Backdrop pointerUp — records miss with release position
  const handleBackdropPointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (gamePhase !== 'playing') return
    if (!useFootball.getState().isPowerCharging) return
    const p = event.point
    pendingShotRef.current = { type: 'miss', position: [p.x, p.y, p.z] }
  }, [gamePhase])

  const registerInterceptionRef = useRef(registerInterception)
  registerInterceptionRef.current = registerInterception

  // Check if a football position collides with any defender
  const checkDefenderCollision = useCallback((pos: [number, number, number]): number => {
    for (let i = 0; i < defenderRefs.length; i++) {
      const handle = defenderRefs[i].current
      if (!handle) continue
      const dPos = handle.getPosition()
      const dx = pos[0] - dPos[0]
      const dy = pos[1] - dPos[1]
      const dz = pos[2] - dPos[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < DEFENDER_CONFIG.collisionRadius) return i
    }
    return -1
  }, [defenderRefs])

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

  // Called when a football projectile arrives at its destination
  const handleFootballArrival = useCallback((football: ActiveFootball) => {
    setFootballs((prev) => prev.filter((x) => x.id !== football.id))

    const { hitData, powerRatio } = football

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
        text = `MVP! ${hitData.label} +${finalMultipliedPoints} ${multiplierText}`
        color = '#9B59B6'
        audioManager.playVoice('whatAShot')
        audioManager.play('crowdCheer')
        triggerConfettiRef.current()
      } else if (basePoints >= 10) {
        text = `STAR! ${hitData.label} +${finalMultipliedPoints} ${multiplierText}`
        color = '#E74C3C'
        audioManager.play('goalReaction')
        triggerConfettiRef.current()
      } else if (basePoints >= 5) {
        text = `GREAT! ${hitData.label} +${finalMultipliedPoints} ${multiplierText}`
        color = '#F7C948'
      } else if (basePoints >= 3) {
        color = '#2ECC71'
      }

      // Streak bonus — read current streak at arrival time
      const currentStreakNow = useScoreStore.getState().currentStreak
      if (currentStreakNow >= FOOTBALL_CONFIG.streakBonusThreshold) {
        finalPoints *= FOOTBALL_CONFIG.streakBonusMultiplier
        text += ` x2 STREAK!`
        const streakVoices = ['onFire', 'onARoll', 'crowdGoesWild'] as const
        audioManager.playVoice(streakVoices[Math.floor(Math.random() * streakVoices.length)])
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

  // Called when a football is intercepted by a defender
  const handleInterception = useCallback((football: ActiveFootball) => {
    setFootballs((prev) => prev.filter((x) => x.id !== football.id))
    registerInterceptionRef.current()
    resetStreakRef.current()
    audioManager.play('interception')

    // Find which defender intercepted and trigger their celebrate
    const pos = football.end
    for (let i = 0; i < defenderRefs.length; i++) {
      const handle = defenderRefs[i].current
      if (!handle) continue
      const dPos = handle.getPosition()
      const dx = pos[0] - dPos[0]
      const dz = pos[2] - dPos[2]
      if (Math.sqrt(dx * dx + dz * dz) < DEFENDER_CONFIG.collisionRadius * 2) {
        handle.triggerCelebrate()
        break
      }
    }

    addPopupRef.current('INTERCEPTED!', [pos[0], pos[1] + 1, pos[2]], '#E74C3C')
  }, [defenderRefs])

  // Window pointerUp → launch the football; scoring deferred to arrival
  // On mobile, this fires on canvas touch-end — which is the intended trigger
  useEffect(() => {
    const handlePointerUp = () => {
      if (!useFootball.getState().isPowerCharging) return
      const pending = pendingShotRef.current
      pendingShotRef.current = null
      const { power } = releaseShot()

      // No valid interaction (released off-screen or on empty space) — cancel
      if (!pending) return

      shoot() // count the shot
      audioManager.play('arrowShoot')

      // Spawn football carrying hit data — scoring happens on arrival
      const startPos: [number, number, number] = [
        FOOTBALL_CONFIG.cameraPosition[0],
        FOOTBALL_CONFIG.cameraPosition[1],
        FOOTBALL_CONFIG.cameraPosition[2] - 1,
      ]
      const id = footballIdRef.current++
      const powerRatio = power / FOOTBALL_CONFIG.maxPower
      setFootballs((prev) => [...prev, { id, start: startPos, end: pending.position, hitData: pending, powerRatio }])

      setThrowing(true)
      setTimeout(() => setThrowing(false), 100)
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
      <Skybox scene="football" />

      <Field />

      {/* Large invisible backdrop plane to catch missed shots on release */}
      <mesh
        position={[0, 4, -20]}
        onPointerUp={handleBackdropPointerUp}
      >
        <planeGeometry args={[60, 40]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <FootballTargetSpawner
        maxTargets={config.maxTargets}
        speedScale={config.targetSpeedScale}
        sizeScale={config.targetSizeScale}
        paused={gamePhase !== 'playing'}
        onTargetHit={handleTargetHit}
      />

      {/* Defender blockers */}
      {defenderLanes.map((lane, i) => (
        <DefenderBlocker
          key={`defender-${lane.z}`}
          ref={defenderRefs[i]}
          lane={lane}
          paused={gamePhase !== 'playing'}
        />
      ))}

      {footballs.map((f) => (
        <FootballProjectile
          key={f.id}
          startPosition={f.start}
          endPosition={f.end}
          onComplete={() => handleFootballArrival(f)}
          onIntercepted={() => handleInterception(f)}
          checkDefenderCollision={checkDefenderCollision}
        />
      ))}

      <GameAvatar position={[0, 0, 5]} rotationY={0} animation={avatarAnimation} />

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

export function Football() {
  return <FootballGame />
}
