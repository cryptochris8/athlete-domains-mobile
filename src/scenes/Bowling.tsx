import { useEffect, useCallback, useRef, useMemo, useState } from 'react'
import { Text } from '@react-three/drei'
import { Skybox } from '@/components/Skybox'
import { useGameStore } from '@/stores/useGameStore'
import { useScoreStore } from '@/stores/useScoreStore'
import { PhysicsProvider } from '@/core/PhysicsProvider'
import { Lane } from '@/games/bowling/Lane'
import { Pins, type PinsHandle } from '@/games/bowling/Pins'
import { BowlingBall } from '@/games/bowling/BowlingBall'
import { useBowling } from '@/games/bowling/useBowling'
import { getBowlingConfig } from '@/games/bowling/config'
import { ScorePopup } from '@/components/ScorePopup'
import { Confetti } from '@/components/Confetti'
import { useGameScene } from '@/hooks/useGameScene'
import { audioManager } from '@/core/AudioManager'
import { GameAvatar } from '@/components/GameAvatar'
import type { AnimationState } from '@/components/HytopiaAvatar'
import { useMobileStore } from '@/stores/useMobileStore'

function BowlingGame() {
  const gamePhase = useGameStore((s) => s.gamePhase)
  const isMobileDevice = useMobileStore((s) => s.isMobile)
  const selectedDifficulty = useGameStore((s) => s.selectedDifficulty)
  const bowlingConfig = useMemo(() => getBowlingConfig(selectedDifficulty), [selectedDifficulty])
  const addScore = useScoreStore((s) => s.addScore)
  const {
    phase: bowlingPhase,
    currentFrame,
    ballsThisFrame,
    isStrike,
    isSpare,
    frameScores,
    setPinsKnocked,
    endBall,
    nextFrame,
    resetGame,
  } = useBowling()

  const { popups, showConfetti, addPopup, removePopup, triggerConfetti, endGame } = useGameScene('bowling', () => resetGame(bowlingConfig.totalFrames))

  const pinsRef = useRef<PinsHandle>(null)

  const [reactionAnim, setReactionAnim] = useState<AnimationState | null>(null)
  const prevBowlingPhaseRef = useRef(bowlingPhase)

  // Compute avatar animation from bowling phase
  const avatarAnimation: AnimationState = useMemo(() => {
    if (reactionAnim) return reactionAnim
    if (bowlingPhase === 'charging' || bowlingPhase === 'spinning') return 'charge'
    return 'idle'
  }, [reactionAnim, bowlingPhase])

  // Detect swing moment (transition to rolling)
  useEffect(() => {
    if (bowlingPhase === 'rolling' && (prevBowlingPhaseRef.current === 'charging' || prevBowlingPhaseRef.current === 'spinning')) {
      setReactionAnim('swing')
      const timer = setTimeout(() => setReactionAnim(null), 800)
      return () => clearTimeout(timer)
    }
    prevBowlingPhaseRef.current = bowlingPhase
  }, [bowlingPhase])

  // Celebrate/disappointed on frame result
  useEffect(() => {
    if (bowlingPhase !== 'frameover') return
    if (isStrike || isSpare) {
      setReactionAnim('celebrate')
    } else {
      // Check if it was a gutter (0 pins)
      const lastScore = frameScores[frameScores.length - 1] ?? 0
      if (lastScore === 0) {
        setReactionAnim('disappointed')
      }
    }
    const timer = setTimeout(() => setReactionAnim(null), 2000)
    return () => clearTimeout(timer)
  }, [bowlingPhase, isStrike, isSpare, frameScores])

  // Guard: prevent frameover effect from processing multiple times per frame
  const frameOverHandled = useRef(false)

  // When returning to positioning after ball 1 (not a strike), reset knocked pins
  useEffect(() => {
    if (bowlingPhase === 'positioning' && ballsThisFrame === 1) {
      // Between ball 1 and ball 2: clear knocked pins, re-spot standing pins
      if (pinsRef.current) {
        pinsRef.current.resetUnknocked()
      }
    }
  }, [bowlingPhase, ballsThisFrame])


  const handleBallStopped = useCallback(() => {
    if (!pinsRef.current) return
    setTimeout(() => {
      if (!pinsRef.current) return
      // Double-check we're still in rolling phase (guard against stale timeouts)
      const currentPhase = useBowling.getState().phase
      if (currentPhase !== 'rolling') return

      const knocked = pinsRef.current.checkKnocked()
      setPinsKnocked(knocked)
      endBall()
    }, 1500)
  }, [setPinsKnocked, endBall])

  // Handle frame over - with guard to prevent multiple processing
  useEffect(() => {
    if (bowlingPhase === 'frameover' && !frameOverHandled.current) {
      frameOverHandled.current = true

      let text = ''
      let color = '#F7C948'
      const lastScore = frameScores[frameScores.length - 1] ?? 0

      if (isStrike) {
        text = 'STRIKE!'
        color = '#2ECC71'
        audioManager.playVoice('strike')
        triggerConfetti()
      } else if (isSpare) {
        text = 'SPARE!'
        color = '#4FC3F7'
        audioManager.playVoice('spare')
      } else {
        text = `+${lastScore}`
      }

      addScore(lastScore)
      addPopup(text, [0, 2, -5], color)

      setTimeout(() => {
        handleNextFrame()
      }, 2000)
    }

    // Reset guard when leaving frameover phase
    if (bowlingPhase !== 'frameover') {
      frameOverHandled.current = false
    }
  }, [bowlingPhase, isStrike, isSpare, frameScores, addScore, currentFrame, triggerConfetti, addPopup]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextFrame = useCallback(() => {
    if (pinsRef.current) {
      pinsRef.current.resetPins()
    }
    nextFrame()
    // Check synchronously after nextFrame — avoids stale-state bug
    // where a reactive effect fires 'done' on remount from previous game
    if (useBowling.getState().phase === 'done') {
      endGame()
    } else {
      useGameStore.getState().setGamePhase('playing')
    }
  }, [nextFrame, endGame])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[3, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={isMobileDevice ? 512 : 2048}
        shadow-mapSize-height={isMobileDevice ? 512 : 2048}
      />
      <Skybox scene="bowling" />
      <color attach="background" args={['#1a1a2e']} />

      <PhysicsProvider paused={gamePhase !== 'playing'}>
        <Lane hasBumpers={bowlingConfig.hasBumpers} />
        <Pins ref={pinsRef} />
        <BowlingBall onBallStopped={handleBallStopped} />
        <GameAvatar position={[0, 0, 8]} rotationY={0} animation={avatarAnimation} />
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

      {showConfetti && <Confetti position={[0, 1, -7]} />}

      <Text
        position={[-1.5, 2, -7]}
        fontSize={0.3}
        color="#fff"
        anchorX="left"
      >
        {`Frame ${currentFrame} / ${bowlingConfig.totalFrames}`}
      </Text>
    </>
  )
}

export function Bowling() {
  return <BowlingGame />
}
