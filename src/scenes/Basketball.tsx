import { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { PerspectiveCamera } from '@react-three/drei'
import { Skybox } from '@/components/Skybox'
import { useGameStore } from '@/stores/useGameStore'
import { useMobileStore } from '@/stores/useMobileStore'
import { useScoreStore } from '@/stores/useScoreStore'
import { PhysicsProvider } from '@/core/PhysicsProvider'
import { Court } from '@/games/basketball/Court'
import { Hoop } from '@/games/basketball/Hoop'
import { BallAndShooter } from '@/games/basketball/BallAndShooter'
import { useBasketball } from '@/games/basketball/useBasketball'
import { BASKETBALL_CONFIG, getBasketballConfig } from '@/games/basketball/config'
import { ScorePopup } from '@/components/ScorePopup'
import { Confetti } from '@/components/Confetti'
import { ScreenShake } from '@/components/ScreenShake'
import { useGameScene } from '@/hooks/useGameScene'
import { audioManager } from '@/core/AudioManager'
import { GameAvatar } from '@/components/GameAvatar'
import type { AnimationState } from '@/components/HytopiaAvatar'

import { useBasketballUI } from '@/stores/useBasketballUI'

function BasketballGame() {
  const gamePhase = useGameStore((s) => s.gamePhase)
  const selectedDifficulty = useGameStore((s) => s.selectedDifficulty)
  const isMobileDevice = useMobileStore((s) => s.isMobile)
  const config = useMemo(() => getBasketballConfig(selectedDifficulty), [selectedDifficulty])
  const addScore = useScoreStore((s) => s.addScore)
  const incrementStreak = useScoreStore((s) => s.incrementStreak)
  const currentStreak = useScoreStore((s) => s.currentStreak)

  const hasPowerShot = useBasketballUI((s) => s.hasPowerShot)
  const setHasPowerShot = useBasketballUI((s) => s.setHasPowerShot)

  const {
    shotsRemaining,
    isBallFlying,
    isPowerCharging,
    shotResult,
    registerBackboardHit,
    registerRimHit,
    registerScore,
    decrementTime,
    resetGame,
  } = useBasketball()

  const [shakeActive, setShakeActive] = useState(false)
  const [reactionAnim, setReactionAnim] = useState<AnimationState | null>(null)
  const prevFlyingRef = useRef(false)

  // Compute avatar animation from game state
  const avatarAnimation: AnimationState = useMemo(() => {
    if (reactionAnim) return reactionAnim
    if (isPowerCharging) return 'charge'
    return 'idle'
  }, [reactionAnim, isPowerCharging])

  // Detect transition from charging to flying (throw moment)
  useEffect(() => {
    if (isBallFlying && !prevFlyingRef.current) {
      setReactionAnim('throw')
      const timer = setTimeout(() => setReactionAnim(null), 800)
      return () => clearTimeout(timer)
    }
    prevFlyingRef.current = isBallFlying
  }, [isBallFlying])

  // Celebrate/disappointed on shot result
  useEffect(() => {
    if (!shotResult) return
    if (shotResult === 'miss') {
      setReactionAnim('disappointed')
    } else {
      setReactionAnim('celebrate')
    }
    const timer = setTimeout(() => setReactionAnim(null), 2000)
    return () => clearTimeout(timer)
  }, [shotResult])

  const { popups, showConfetti, addPopup, removePopup, triggerConfetti, endGame } = useGameScene('basketball', () => {
    resetGame(config.totalShots, config.roundTimeSeconds)
    setHasPowerShot(false)
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

  // Check game over on shots
  const endGameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (shotsRemaining <= 0 && !isBallFlying && gamePhase === 'playing') {
      endGameTimerRef.current = setTimeout(() => endGame(), 1500)
    }
    return () => {
      if (endGameTimerRef.current) {
        clearTimeout(endGameTimerRef.current)
        endGameTimerRef.current = null
      }
    }
  }, [shotsRemaining, isBallFlying, gamePhase, endGame])

  // Show "Miss!" popup when a shot misses
  useEffect(() => {
    if (shotResult === 'miss') {
      addPopup('Miss!', [0, 3, -5], '#888888')
    }
  }, [shotResult, addPopup])

  const handleScore = useCallback(() => {
    const result = registerScore()
    let points = 0
    let text = ''
    let color = '#F7C948'

    switch (result) {
      case 'swish':
        points = BASKETBALL_CONFIG.swishPoints
        text = `SWISH! +${points}`
        color = '#2ECC71'
        break
      case 'backboard':
        points = BASKETBALL_CONFIG.backboardPoints
        text = `Backboard! +${points}`
        color = '#F7C948'
        break
      case 'rim':
        points = BASKETBALL_CONFIG.rimPoints
        text = `Rim shot! +${points}`
        color = '#FF6B35'
        break
    }

    if (result !== 'miss') {
      const newStreak = currentStreak + 1
      if (newStreak >= BASKETBALL_CONFIG.streakBonusThreshold) {
        points *= BASKETBALL_CONFIG.streakBonusMultiplier
        text += ` x2 STREAK!`
        audioManager.playVoice('streak')
        audioManager.play('crowd')
      }

      if (hasPowerShot) {
        points *= 2
        text += ` POWER!`
        color = '#FF6B35'
        setHasPowerShot(false)
      }

      addScore(points)
      incrementStreak()

      // Trigger screen shake
      setShakeActive(true)
      setTimeout(() => setShakeActive(false), 300)

      addPopup(text, [0, 3.5, -5], color)

      if (result === 'swish') {
        audioManager.play('swish')
        audioManager.playVoice('swish')
        triggerConfetti()
      } else {
        audioManager.play('bounce')
      }
    }
  }, [registerScore, addScore, incrementStreak, currentStreak, hasPowerShot, setHasPowerShot, addPopup, triggerConfetti])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 3.5]} fov={50} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 12, 8]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={isMobileDevice ? 512 : 2048}
        shadow-mapSize-height={isMobileDevice ? 512 : 2048}
      />
      <Skybox scene="basketball" />

      <PhysicsProvider paused={gamePhase !== 'playing'}>
        <Court />
        <Hoop
          onScoreSensor={handleScore}
          onBackboardHit={registerBackboardHit}
          onRimHit={registerRimHit}
        />
        <BallAndShooter />
        <GameAvatar position={[BASKETBALL_CONFIG.ballStartPosition[0], 0, BASKETBALL_CONFIG.ballStartPosition[2] + 0.5]} rotationY={0} animation={avatarAnimation} />
      </PhysicsProvider>

      {popups.map((popup) => (
        <ScorePopup
          key={popup.id}
          text={popup.text}
          position={popup.position}
          color={popup.color}
          onComplete={() => removePopup(popup.id)}
        />
      ))}

      {showConfetti && <Confetti position={[0, 3.5, -5]} />}
      <ScreenShake active={shakeActive} intensity={0.1} duration={0.25} />
    </>
  )
}

export function Basketball() {
  return <BasketballGame />
}
