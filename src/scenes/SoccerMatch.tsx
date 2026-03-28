import React, { useRef, useCallback, useEffect, useState, Suspense, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier'
import { Skybox } from '@/components/Skybox'
import { PhysicsProvider } from '@/core/PhysicsProvider'
import { useGameStore } from '@/stores/useGameStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useSoccerSetupStore } from '@/stores/useSoccerSetupStore'
import { useSoccerMatchStore } from '@/stores/useSoccerMatchStore'
import { getAvatarSkin } from '@/components/GameAvatar'
import { HytopiaAvatar, type AnimationState } from '@/components/HytopiaAvatar'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useMouseLook } from '@/hooks/useMouseLook'
import { useMobileStore, MOBILE_CONFIG } from '@/stores/useMobileStore'
import {
  calculateMoveDirection,
  isSprinting,
  isShootKey,
  isPassKey,
  rotateMovementByCamera,
  lerpAngle,
} from '@/components/PlayerController'
import { HUB } from '@/core/constants'
import { audioManager } from '@/core/AudioManager'
import {
  createInitialMatchState,
  startMatch,
  type MatchState,
  scoreGoal,
} from '@/systems/matchRules'
import {
  DEFAULT_FORMATION,
  getRoleHomePosition,
  type Vec3,
} from '@/systems/soccerAI'
import {
  createPossessionState,
  getDribblePosition,
  POSSESSION,
  type PossessionState,
} from '@/systems/possession'
import {
  processChargeShoot,
  processPass,
  buildTackleCandidates,
  processTackles,
  buildPickupCandidates,
  processPickups,
  processAIPossession,
  updateTeamAI,
  updateBallVelocity,
  detectNearMiss,
  resolvePossessionTeam,
  TACKLE_PROB_BY_DIFFICULTY,
  type ChargeState,
} from '@/systems/soccerGameLoop'
import { SoccerCrowdManager } from '@/systems/soccerCrowdManager'
import { Confetti } from '@/components/Confetti'
import {
  MATCH_FIELD,
  PLAYER_SPEED,
  BALL_RADIUS,
  AI_SPEED,
  MatchField,
  MatchGoal,
  MatchBall,
  AIPlayer,
  JERSEY_BLUE,
  JERSEY_RED,
  type AIPlayerHandle,
} from '@/scenes/SoccerMatchComponents'
import { useMatchTimer } from '@/games/soccer/useMatchTimer'
import { useKickoffCountdown } from '@/games/soccer/useKickoffCountdown'

// ─── Main Match Game ─────────────────────────────────────────────
// Striker is always the last role in DEFAULT_FORMATION (index 5)
const STRIKER_INDEX = DEFAULT_FORMATION.indexOf('striker')

/** Build an AI-only formation by removing the striker slot (replaced by human player) */
function getAIFormation() {
  return DEFAULT_FORMATION.filter((_, i) => i !== STRIKER_INDEX)
}

// ─── Player movement helper ─────────────────────────────────────
// Shared between P1 and P2 to avoid duplicated movement code.
interface MovePlayerParams {
  body: RapierRigidBody
  avatarGroup: THREE.Group | null
  moveDir: THREE.Vector3
  moving: boolean
  sprinting: boolean
  currentFacing: React.MutableRefObject<number>
  velocityTmp: THREE.Vector3
  delta: number
  /** Only used for idle facing lerp (P1 only; pass null for P2) */
  yawForIdle: number | null
}

/**
 * Applies camera-relative movement + clamping + facing to a player body.
 * Writes the final position into `outPos` and returns it.
 */
function movePlayer(params: MovePlayerParams, outPos: THREE.Vector3): THREE.Vector3 {
  const { body, avatarGroup, moveDir, moving, sprinting, currentFacing, velocityTmp, delta, yawForIdle } = params
  const currentPos = body.translation()
  outPos.set(currentPos.x, 0, currentPos.z)

  if (moving) {
    const speed = sprinting ? PLAYER_SPEED * HUB.sprintMultiplier : PLAYER_SPEED
    const velocity = velocityTmp.copy(moveDir).multiplyScalar(speed * delta)
    const newX = Math.max(-MATCH_FIELD.halfWidth, Math.min(MATCH_FIELD.halfWidth, outPos.x + velocity.x))
    const newZ = Math.max(-MATCH_FIELD.halfLength, Math.min(MATCH_FIELD.halfLength, outPos.z + velocity.z))
    body.setNextKinematicTranslation({ x: newX, y: 0, z: newZ })

    const targetAngle = Math.atan2(-moveDir.x, -moveDir.z)
    currentFacing.current = targetAngle
    if (avatarGroup) {
      avatarGroup.rotation.y = currentFacing.current
    }
    outPos.set(newX, 0, newZ)
  } else if (yawForIdle !== null) {
    // Idle: slowly align to camera forward (P1 only)
    currentFacing.current = lerpAngle(currentFacing.current, yawForIdle, HUB.idleFacingLerpSpeed)
    if (avatarGroup) {
      avatarGroup.rotation.y = currentFacing.current
    }
  }

  return outPos
}

function SoccerMatchGame() {
  const gamePhase = useGameStore((s) => s.gamePhase)
  const selectedDifficulty = useGameStore((s) => s.selectedDifficulty)
  const isMobileDevice = useMobileStore((s) => s.isMobile)

  // Setup store — team selections from pre-match UI
  const player1Team = useSoccerSetupStore((s) => s.player1Team)
  const playerCount = useSoccerSetupStore((s) => s.playerCount)
  const player2Team = useSoccerSetupStore((s) => s.player2Team)

  const ballRef = useRef<RapierRigidBody>(null)
  const bodyRef = useRef<RapierRigidBody>(null)
  const avatarGroupRef = useRef<THREE.Group>(null)
  const bodyRef2 = useRef<RapierRigidBody>(null)
  const avatarGroupRef2 = useRef<THREE.Group>(null)
  const { camera } = useThree()

  // Hub-style input
  const keys = useKeyboard()
  const { yaw, pitch } = useMouseLook()
  const currentFacing = useRef(0)
  const currentFacing2 = useRef(0)
  const isFirstFrame = useRef(true)
  const [movementState, setMovementState] = useState<AnimationState>('idle')
  const [movementState2, setMovementState2] = useState<AnimationState>('idle')

  // Player skin
  const skinId = usePlayerStore((s) => {
    const profile = s.profiles.find((p) => p.id === s.activeProfileId)
    return profile?.skinId
  })
  const skinUrl = getAvatarSkin(skinId)

  // AI formation for each team — 5 AI when a human is on that team, 6 AI otherwise
  const homeAIFormation = player1Team === 'home' || (playerCount === 2 && player2Team === 'home')
    ? getAIFormation() : DEFAULT_FORMATION
  const awayAIFormation = player1Team === 'away' || (playerCount === 2 && player2Team === 'away')
    ? getAIFormation() : DEFAULT_FORMATION

  // AI state — counts drive rendering; refs drive per-frame transform/animation updates
  const [homePlayerCount, setHomePlayerCount] = useState(0)
  const [awayPlayerCount, setAwayPlayerCount] = useState(0)
  const homePlayerRefs = useRef<React.RefObject<AIPlayerHandle | null>[]>([])
  const awayPlayerRefs = useRef<React.RefObject<AIPlayerHandle | null>[]>([])
  const aiTargets = useRef<{ home: Vec3[]; away: Vec3[] }>({ home: [], away: [] })
  const aiFacing = useRef<{ home: number[]; away: number[] }>({ home: Array(6).fill(0), away: Array(6).fill(Math.PI) })

  // Match state
  const matchRef = useRef<MatchState>(createInitialMatchState())
  const goalCooldown = useRef(false)
  const oobCooldownUntil = useRef(0)

  // Possession state
  const possession = useRef<PossessionState>(createPossessionState())
  const aiDribbleFrames = useRef(0)
  const elapsedTime = useRef(0)

  // Pass-target tracking: when a pass is made, the target teammate runs to intercept
  const passTarget = useRef<{ team: 'home' | 'away'; index: number; destination: Vec3 } | null>(null)

  // Ball velocity tracking (for GK shot prediction)
  const prevBallPos = useRef<Vec3>({ x: 0, y: 0, z: 0 })
  const ballVelocity = useRef<Vec3>({ x: 0, y: 0, z: 0 })

  // Crowd manager — announcer commentary + crowd atmosphere
  const crowdManager = useRef(new SoccerCrowdManager())

  // Goal confetti state
  const [goalConfetti, setGoalConfetti] = useState<[number, number, number] | null>(null)

  // Near-miss tracking — time of last shot for detecting near misses
  const lastShotTime = useRef(0)

  // Charge state (P1)
  const p1Charge = useRef<ChargeState>({ charging: false, chargeStartTime: 0, shootPower: 0 })

  // Reusable THREE.Vector3 instances — avoids per-frame allocations in useFrame
  const _pos = useRef(new THREE.Vector3())
  const _camTarget = useRef(new THREE.Vector3())
  const _p2Pos = useRef(new THREE.Vector3())
  const _velocity = useRef(new THREE.Vector3())
  const _velocity2 = useRef(new THREE.Vector3())

  // Input button refs — event handlers only toggle these, useFrame reads them
  const shootBtnRef = useRef(false)
  const passBtnRef = useRef(false)

  // P2 charge state
  const p2Charge = useRef<ChargeState>({ charging: false, chargeStartTime: 0, shootPower: 0 })

  const setMatchState = useSoccerMatchStore((s) => s.setMatchState)
  const pushEvents = useSoccerMatchStore((s) => s.pushEvents)
  const setShootPower = useSoccerMatchStore((s) => s.setShootPower)
  const setIsCharging = useSoccerMatchStore((s) => s.setIsCharging)
  const setKickoffCountdown = useSoccerMatchStore((s) => s.setKickoffCountdown)

  // ─── Extracted hooks ────────────────────────────────────────────

  const {
    isMounted: _isMounted,
    kickoffFreezeUntil,
    startCountdown,
    scheduleTimer,
  } = useKickoffCountdown(setKickoffCountdown)

  // resetPossessionAndBall must be declared before matchTimerCallbacks
  // Reset possession + ball to center after goal
  const resetPossessionAndBall = useCallback(() => {
    possession.current = createPossessionState()
    aiDribbleFrames.current = 0

    // Immediately stop the ball where it is (inside the net)
    if (ballRef.current) {
      ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }

    // After 8s celebration, move ball to center and start 3s countdown
    scheduleTimer(() => {
      if (ballRef.current) {
        ballRef.current.setBodyType(0, true)
        ballRef.current.setTranslation({ x: 0, y: BALL_RADIUS, z: 0 }, true)
        ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
        ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
      }
      startCountdown()
    }, 8000)
  }, [scheduleTimer, startCountdown])

  // Stable ref so matchTimerCallbacks can call resetPossessionAndBall without re-creating
  const resetPossessionAndBallRef = useRef(resetPossessionAndBall)
  resetPossessionAndBallRef.current = resetPossessionAndBall

  const matchTimerCallbacks = useMemo(() => ({
    onHalftime: () => {
      audioManager.play('whistle')
      crowdManager.current.onHalftime()
    },
    onMatchEnd: () => {
      audioManager.play('whistle')
      crowdManager.current.onMatchEnd()
    },
    onTicking: () => audioManager.play('countdown'),
    onStoppageTime: () => crowdManager.current.onStoppageTime(),
    onSecondHalfStart: () => {
      audioManager.play('whistle')
      resetPossessionAndBallRef.current()
    },
  }), [])

  const { updateTimer } = useMatchTimer(matchTimerCallbacks)

  // Release ball helper — switches back to dynamic and sets velocity directly
  const releaseBall = useCallback((dirX: number, dirZ: number, force: number, lift: number) => {
    if (!ballRef.current) return
    const now = performance.now()
    const ps = possession.current
    possession.current = {
      ...ps,
      possessor: null,
      pickupCooldownUntil: now + POSSESSION.PICKUP_COOLDOWN_MS,
      lastPossessorType: ps.possessor?.type ?? null,
      lastPossessorIndex: ps.possessor?.index ?? -1,
    }
    aiDribbleFrames.current = 0
    // Switch ball back to Dynamic (type 0) and set velocity directly
    ballRef.current.setBodyType(0, true)
    ballRef.current.setLinvel({ x: dirX * force, y: lift, z: dirZ * force }, true)
    ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
  }, [])

  // Input event handlers — ONLY toggle refs, no game logic (P1 WASD+mouse)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Space') shootBtnRef.current = true
      else if (e.code === 'KeyE') passBtnRef.current = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') shootBtnRef.current = false
    }
    const onMouseDown = (e: MouseEvent) => {
      if (!document.pointerLockElement) return
      if (e.button === 0) shootBtnRef.current = true
      else if (e.button === 2) passBtnRef.current = true
    }
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) shootBtnRef.current = false
    }
    const onContextMenu = (e: MouseEvent) => {
      if (document.pointerLockElement) e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('contextmenu', onContextMenu)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('contextmenu', onContextMenu)
    }
  }, [])

  // P2 shoot/pass — read from keys set using isShootKey/isPassKey('arrows')
  const p2PassBtnRef = useRef(false)

  // Initialize match
  useEffect(() => {
    const state = startMatch(createInitialMatchState())
    matchRef.current = state
    setMatchState(state)
    audioManager.play('whistle')
    startCountdown()
    crowdManager.current.start()
    crowdManager.current.onMatchStart()

    // Initialize AI positions — only for AI-controlled slots
    const homePosArr: Vec3[] = []
    const awayPosArr: Vec3[] = []
    for (const role of homeAIFormation) {
      homePosArr.push(getRoleHomePosition(role, MATCH_FIELD.halfWidth, MATCH_FIELD.halfLength, false))
    }
    for (const role of awayAIFormation) {
      awayPosArr.push(getRoleHomePosition(role, MATCH_FIELD.halfWidth, MATCH_FIELD.halfLength, true))
    }
    aiTargets.current = { home: homePosArr, away: awayPosArr }
    aiFacing.current = { home: Array(homePosArr.length).fill(0), away: Array(awayPosArr.length).fill(Math.PI) }
    homePlayerRefs.current = homePosArr.map(() => React.createRef<AIPlayerHandle>())
    awayPlayerRefs.current = awayPosArr.map(() => React.createRef<AIPlayerHandle>())
    setHomePlayerCount(homePosArr.length)
    setAwayPlayerCount(awayPosArr.length)

    return () => {
      crowdManager.current.stop()
    }
  }, [setMatchState])

  // Goal handlers
  const handleGoalNegZ = useCallback(() => {
    if (goalCooldown.current) return
    goalCooldown.current = true
    oobCooldownUntil.current = performance.now() + 5000
    scheduleTimer(() => { goalCooldown.current = false }, 3000)

    const result = scoreGoal(matchRef.current, 'home')
    matchRef.current = result.state
    setMatchState(result.state)
    pushEvents(result.events)
    audioManager.play('whistle')
    crowdManager.current.onGoalScored('home')
    setGoalConfetti([0, 2, -MATCH_FIELD.halfLength])
    scheduleTimer(() => setGoalConfetti(null), 3000)
    resetPossessionAndBall()
  }, [setMatchState, pushEvents, resetPossessionAndBall, scheduleTimer])

  const handleGoalPosZ = useCallback(() => {
    if (goalCooldown.current) return
    goalCooldown.current = true
    oobCooldownUntil.current = performance.now() + 5000
    scheduleTimer(() => { goalCooldown.current = false }, 3000)

    const result = scoreGoal(matchRef.current, 'away')
    matchRef.current = result.state
    setMatchState(result.state)
    pushEvents(result.events)
    audioManager.play('whistle')
    crowdManager.current.onGoalScored('away')
    setGoalConfetti([0, 2, MATCH_FIELD.halfLength])
    scheduleTimer(() => setGoalConfetti(null), 3000)
    resetPossessionAndBall()
  }, [setMatchState, pushEvents, resetPossessionAndBall, scheduleTimer])

  // Main game loop
  useFrame((_, delta) => {
    if (!bodyRef.current) return

    // ─── Match timer (runs even during pauses for timer) ────
    if (gamePhase === 'playing') {
      updateTimer(delta, matchRef, setMatchState, pushEvents)
    }

    // ─── Player 1 movement (hub-style camera-relative + mobile joystick) ────
    const rawDir = calculateMoveDirection(keys.current)
    const mobileState = useMobileStore.getState()
    const mjx = mobileState.joystickVector.x
    const mjy = mobileState.joystickVector.y
    const joystickActive = mjx !== 0 || mjy !== 0
    if (joystickActive) {
      rawDir.set(mjx, 0, -mjy)
      if (rawDir.lengthSq() > 0) rawDir.normalize()
    }
    const moveDir = rotateMovementByCamera(rawDir, -yaw.current)
    const moving = moveDir.lengthSq() > 0
    const sprinting = moving && (isSprinting(keys.current) || (joystickActive && mobileState.joystickForce >= MOBILE_CONFIG.sprintForceThreshold))

    const newState: AnimationState = moving ? (sprinting ? 'run' : 'walk') : 'idle'
    if (newState !== movementState) setMovementState(newState)

    const pos = movePlayer({
      body: bodyRef.current,
      avatarGroup: avatarGroupRef.current,
      moveDir, moving, sprinting,
      currentFacing, velocityTmp: _velocity.current,
      delta, yawForIdle: yaw.current,
    }, _pos.current)

    // ─── Third-person orbital camera (same as hub) ──────────
    const d = HUB.cameraDistance
    const p = pitch.current
    const y = yaw.current
    const camX = pos.x + d * Math.sin(y) * Math.cos(p)
    const camY = pos.y + d * Math.sin(p)
    const camZ = pos.z + d * Math.cos(y) * Math.cos(p)
    const camTarget = _camTarget.current.set(camX, camY, camZ)

    const camLerp = moving ? HUB.movingCameraLerpSpeed : HUB.cameraLerpSpeed
    if (isFirstFrame.current) {
      camera.position.copy(camTarget)
      isFirstFrame.current = false
    } else {
      camera.position.lerp(camTarget, camLerp)
    }
    camera.lookAt(pos.x, pos.y + HUB.cameraHeightOffset, pos.z)

    // ─── Possession & AI movement ──────────────────────────
    if (gamePhase !== 'playing') return
    const mStatus = matchRef.current.status
    if (mStatus === 'waiting' || mStatus === 'finished' || mStatus === 'penalties' || mStatus === 'halftime') return
    if (!ballRef.current) return

    elapsedTime.current += delta
    const now = performance.now()
    const isKickoffFrozen = now < kickoffFreezeUntil.current

    // ── Player goal direction based on team ─────────────
    const p1GoalZ = player1Team === 'home' ? -MATCH_FIELD.halfLength : MATCH_FIELD.halfLength
    const p2GoalZ = player2Team === 'home' ? -MATCH_FIELD.halfLength : MATCH_FIELD.halfLength

    // ── P2 movement (arrows, uses shared movePlayer helper) ─────────
    const pos2 = _p2Pos.current.set(0, 0, 0)
    let moving2 = false
    if (playerCount === 2 && bodyRef2.current) {
      const rawDir2 = calculateMoveDirection(keys.current, 'arrows')
      const moveDir2 = rotateMovementByCamera(rawDir2, -yaw.current)
      moving2 = moveDir2.lengthSq() > 0
      const sprinting2 = moving2 && isSprinting(keys.current, 'arrows')

      const newState2: AnimationState = moving2 ? (sprinting2 ? 'run' : 'walk') : 'idle'
      if (newState2 !== movementState2) setMovementState2(newState2)

      movePlayer({
        body: bodyRef2.current,
        avatarGroup: avatarGroupRef2.current,
        moveDir: moveDir2, moving: moving2, sprinting: sprinting2,
        currentFacing: currentFacing2, velocityTmp: _velocity2.current,
        delta, yawForIdle: null,  // P2 does not idle-face toward camera
      }, pos2)
    }

    // ── P2 shoot/pass detection from keys ──────────────
    const p2ShootDown = isShootKey(keys.current, 'arrows')
    const p2PassDown = isPassKey(keys.current, 'arrows')

    // ── Shoot / Pass input processing (P1) ────────────────
    const playerHasBall = possession.current.possessor?.type === 'player'
    const player2HasBall = possession.current.possessor?.type === 'player-2'
    const ballT = ballRef.current.translation()

    // Merge mobile shoot/pass buttons with keyboard/mouse
    if (mobileState.isMobile) {
      shootBtnRef.current = mobileState.shootHeld
      if (mobileState.passHeld) { passBtnRef.current = true; useMobileStore.getState().setPassHeld(false) }
    }

    const p1ShootAction = processChargeShoot(
      p1Charge.current, playerHasBall, shootBtnRef.current,
      ballT.x, ballT.z, p1GoalZ, MATCH_FIELD.goalWidth, now / 1000,
    )
    if (p1ShootAction.type === 'start' || p1ShootAction.type === 'update') {
      setShootPower(p1ShootAction.power)
      if (p1ShootAction.type === 'start') setIsCharging(true)
    } else if (p1ShootAction.type === 'shoot') {
      audioManager.play('kick')
      releaseBall(p1ShootAction.dirX, p1ShootAction.dirZ, p1ShootAction.power, p1ShootAction.lift)
      lastShotTime.current = now
      setShootPower(0)
      setIsCharging(false)
      return
    } else if (p1ShootAction.type === 'cancel') {
      setShootPower(0)
      setIsCharging(false)
    }

    // P1 pass
    const p1PassAction = processPass(
      playerHasBall, passBtnRef.current,
      pos.x, pos.z, currentFacing.current, player1Team,
      aiTargets.current[player1Team].map((p) => ({ x: p.x, z: p.z })),
    )
    passBtnRef.current = false
    if (p1PassAction.type === 'pass') {
      audioManager.play('kick')
      passTarget.current = { team: p1PassAction.targetTeam!, index: p1PassAction.targetIndex!, destination: p1PassAction.targetPos! }
      releaseBall(p1PassAction.dirX!, p1PassAction.dirZ!, p1PassAction.force!, p1PassAction.lift!)
      return
    }

    // ── P2 Shoot/Pass input processing ───────────────────
    if (playerCount === 2) {
      const p2ShootAction = processChargeShoot(
        p2Charge.current, player2HasBall, p2ShootDown,
        ballT.x, ballT.z, p2GoalZ, MATCH_FIELD.goalWidth, now / 1000,
      )
      if (p2ShootAction.type === 'shoot') {
        audioManager.play('kick')
        releaseBall(p2ShootAction.dirX, p2ShootAction.dirZ, p2ShootAction.power, p2ShootAction.lift)
        lastShotTime.current = now
        return
      }

      // P2 pass
      if (p2PassDown && player2HasBall && !p2PassBtnRef.current) {
        p2PassBtnRef.current = true
        const p2PassAction = processPass(
          player2HasBall, true,
          pos2.x, pos2.z, currentFacing2.current, player2Team,
          aiTargets.current[player2Team].map((p) => ({ x: p.x, z: p.z })),
        )
        if (p2PassAction.type === 'pass') {
          audioManager.play('kick')
          passTarget.current = { team: p2PassAction.targetTeam!, index: p2PassAction.targetIndex!, destination: p2PassAction.targetPos! }
          releaseBall(p2PassAction.dirX!, p2PassAction.dirZ!, p2PassAction.force!, p2PassAction.lift!)
          return
        }
      }
      if (!p2PassDown) p2PassBtnRef.current = false
    }

    const ps = possession.current
    const ballBody = ballRef.current
    const homePosFlat = aiTargets.current.home
    const awayPosFlat = aiTargets.current.away

    // Determine which team the possessor is on
    const possessorIsOnHome = ps.possessor?.type === 'home-ai'
      || (ps.possessor?.type === 'player' && player1Team === 'home')
      || (ps.possessor?.type === 'player-2' && player2Team === 'home')
    const possessorIsOnAway = ps.possessor?.type === 'away-ai'
      || (ps.possessor?.type === 'player' && player1Team === 'away')
      || (ps.possessor?.type === 'player-2' && player2Team === 'away')

    // ── Someone has the ball ─────────────────────────────
    if (ps.possessor) {
      ballBody.setBodyType(2, true)
      ballBody.setLinvel({ x: 0, y: 0, z: 0 }, true)
      ballBody.setAngvel({ x: 0, y: 0, z: 0 }, true)

      let ownerX = 0, ownerZ = 0, ownerFacing = 0, ownerMoving = false
      if (ps.possessor.type === 'player') {
        ownerX = pos.x; ownerZ = pos.z; ownerFacing = currentFacing.current; ownerMoving = moving
      } else if (ps.possessor.type === 'player-2') {
        ownerX = pos2.x; ownerZ = pos2.z; ownerFacing = currentFacing2.current; ownerMoving = moving2
      } else {
        const team = ps.possessor.type === 'home-ai' ? 'home' : 'away'
        const aiPos = aiTargets.current[team][ps.possessor.index]
        if (aiPos) { ownerX = aiPos.x; ownerZ = aiPos.z; ownerFacing = ps.possessor.facingAngle; ownerMoving = true }
      }

      const dribblePos = getDribblePosition(ownerX, ownerZ, ownerFacing, elapsedTime.current, ownerMoving)
      ballBody.setTranslation(dribblePos, true)

      // ── Tackle check ────────────────────────────────────
      const tackleCandidates = buildTackleCandidates(
        possessorIsOnHome, possessorIsOnAway,
        homePosFlat, awayPosFlat,
        { x: pos.x, z: pos.z }, currentFacing.current, player1Team,
        playerCount, { x: pos2.x, z: pos2.z }, currentFacing2.current, player2Team,
      )
      const tackleResult = processTackles(dribblePos.x, dribblePos.z, tackleCandidates, TACKLE_PROB_BY_DIFFICULTY[selectedDifficulty] ?? POSSESSION.TACKLE_PROB)
      if (tackleResult.tackled) {
        audioManager.play('tackle')
        possession.current = {
          possessor: { type: tackleResult.newPossessor!.type, index: tackleResult.newPossessor!.index, facingAngle: tackleResult.newPossessor!.facingAngle },
          pickupCooldownUntil: now + POSSESSION.TACKLE_COOLDOWN_MS,
          lastPossessorType: ps.possessor.type,
          lastPossessorIndex: ps.possessor.index,
        }
        aiDribbleFrames.current = 0
      }

      // ── AI possession behavior (shoot/pass after min dribble) ─
      if (ps.possessor.type !== 'player' && ps.possessor.type !== 'player-2') {
        aiDribbleFrames.current++
        const team = ps.possessor.type === 'home-ai' ? 'home' : 'away'
        const aiFormation = team === 'home' ? homeAIFormation : awayAIFormation
        const teammates = team === 'home' ? homePosFlat : awayPosFlat
        const aiAction = processAIPossession(
          aiDribbleFrames.current, ps.possessor.index, ps.possessor.facingAngle,
          team, aiFormation, ballT.x, ballT.z,
          MATCH_FIELD.halfLength, MATCH_FIELD.goalWidth, teammates, aiTargets.current[team],
        )
        if (aiAction.type === 'shoot') {
          audioManager.play('kick')
          releaseBall(aiAction.dirX, aiAction.dirZ, aiAction.force, aiAction.lift)
          lastShotTime.current = now
        } else if (aiAction.type === 'pass') {
          audioManager.play('kick')
          passTarget.current = { team: aiAction.targetTeam, index: aiAction.targetIndex, destination: aiAction.targetPos }
          releaseBall(aiAction.dirX, aiAction.dirZ, aiAction.force, aiAction.lift)
        }
      }
    } else {
      // ── No one has the ball — ensure dynamic ───────────
      if (ballBody.bodyType() !== 0) ballBody.setBodyType(0, true)

      if (!isKickoffFrozen) {
        const pickupCandidates = buildPickupCandidates(
          { x: pos.x, z: pos.z }, currentFacing.current, playerCount,
          { x: pos2.x, z: pos2.z }, currentFacing2.current,
          homePosFlat, awayPosFlat,
        )
        const pickupResult = processPickups(ballT.x, ballT.z, pickupCandidates, ps, now)
        if (pickupResult.pickedUp) {
          possession.current = {
            ...ps,
            possessor: { type: pickupResult.newPossessor!.type, index: pickupResult.newPossessor!.index, facingAngle: pickupResult.newPossessor!.facingAngle },
          }
          aiDribbleFrames.current = 0
          passTarget.current = null
        }
      }
    }

    // ─── AI movement ────────────────────────────────────────────
    const ballPos: Vec3 = { x: ballT.x, y: 0, z: ballT.z }

    const vel = updateBallVelocity(ballPos, prevBallPos.current, delta)
    ballVelocity.current = vel
    prevBallPos.current = { x: ballPos.x, y: 0, z: ballPos.z }

    const { team: possessionTeam, index: possessorIdx } = resolvePossessionTeam(possession.current.possessor)
    const p1Vec: Vec3 = { x: pos.x, y: 0, z: pos.z }
    const p2Vec: Vec3 = { x: pos2.x, y: 0, z: pos2.z }

    const aiConfig = {
      ballPos, ballVelocity: ballVelocity.current,
      possessionTeam, possessorIndex: possessorIdx,
      possessor: possession.current.possessor,
      player1Team, playerCount, player2Team, p1Vec, p2Vec,
      playerPos: pos, fieldHalfWidth: MATCH_FIELD.halfWidth,
      fieldHalfLength: MATCH_FIELD.halfLength, goalWidth: MATCH_FIELD.goalWidth,
      hasPossession: !!possession.current.possessor, delta, aiSpeed: AI_SPEED,
    }

    const homeResults = updateTeamAI({
      ...aiConfig, team: 'home', formation: homeAIFormation,
      aiPositions: aiTargets.current.home, aiFacings: aiFacing.current.home,
      opponentAIPositions: aiTargets.current.away,
      passTarget: passTarget.current ? { team: passTarget.current.team, index: passTarget.current.index } : null,
    })
    const awayResults = updateTeamAI({
      ...aiConfig, team: 'away', formation: awayAIFormation,
      aiPositions: aiTargets.current.away, aiFacings: aiFacing.current.away,
      opponentAIPositions: aiTargets.current.home,
      passTarget: passTarget.current ? { team: passTarget.current.team, index: passTarget.current.index } : null,
    })

    // Update possessor facing from AI movement results
    for (let i = 0; i < homeResults.length; i++) {
      const r = homeResults[i]
      if (r.facingAngle !== undefined
        && possession.current.possessor?.type === 'home-ai'
        && possession.current.possessor.index === i) {
        possession.current.possessor.facingAngle = r.facingAngle
      }
    }
    for (let i = 0; i < awayResults.length; i++) {
      const r = awayResults[i]
      if (r.facingAngle !== undefined
        && possession.current.possessor?.type === 'away-ai'
        && possession.current.possessor.index === i) {
        possession.current.possessor.facingAngle = r.facingAngle
      }
    }

    // ── Near-miss detection ───────────────────────────────────
    if (detectNearMiss(ballT.x, ballT.z, !!possession.current.possessor, lastShotTime.current, now, MATCH_FIELD.halfLength, MATCH_FIELD.goalWidth)) {
      crowdManager.current.onNearMiss()
      lastShotTime.current = 0
    }

    // ── Out-of-bounds detection ──────────────────────────────────────
    if (gamePhase === 'playing' && !goalCooldown.current && now > oobCooldownUntil.current) {
      const ballPos2 = ballRef.current?.translation()
      if (ballPos2) {
        const bx = ballPos2.x
        const bz = ballPos2.z

        // Sideline out
        if (Math.abs(bx) > MATCH_FIELD.halfWidth && Math.abs(bz) < MATCH_FIELD.halfLength) {
          const resetX = Math.sign(bx) * (MATCH_FIELD.halfWidth - 0.5)
          const resetZ = Math.max(-MATCH_FIELD.halfLength + 1, Math.min(MATCH_FIELD.halfLength - 1, bz))

          possession.current = createPossessionState()
          aiDribbleFrames.current = 0
          oobCooldownUntil.current = now + 3000

          if (ballRef.current) {
            ballRef.current.setBodyType(0, true)
            ballRef.current.setTranslation({ x: resetX, y: BALL_RADIUS, z: resetZ }, true)
            ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
            ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
          }
          kickoffFreezeUntil.current = now + 2000
          audioManager.play('whistle')
        }
        // Endline out (no goal — goals are handled by the sensor triggers)
        else if (Math.abs(bz) > MATCH_FIELD.halfLength && Math.abs(bx) > MATCH_FIELD.goalWidth / 2 && Math.abs(bx) < MATCH_FIELD.halfWidth + 1) {
          const lastType = possession.current.lastPossessorType
          const isNegZEnd = bz < 0
          const defendingTeam = isNegZEnd ? 'away' : 'home'

          let resetX = 0
          let resetZ = 0

          const lastTeam = lastType === 'home-ai' || lastType === 'player' ? 'home' : 'away'
          const wasDefenderLast = lastTeam === defendingTeam

          if (wasDefenderLast) {
            resetX = 0
            resetZ = isNegZEnd ? -(MATCH_FIELD.halfLength - 8) : (MATCH_FIELD.halfLength - 8)
          } else {
            resetX = Math.sign(bx !== 0 ? bx : 1) * (MATCH_FIELD.halfWidth - 1)
            resetZ = isNegZEnd ? -(MATCH_FIELD.halfLength - 1) : (MATCH_FIELD.halfLength - 1)
          }

          possession.current = createPossessionState()
          aiDribbleFrames.current = 0
          oobCooldownUntil.current = now + 3000

          if (ballRef.current) {
            ballRef.current.setBodyType(0, true)
            ballRef.current.setTranslation({ x: resetX, y: BALL_RADIUS, z: resetZ }, true)
            ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
            ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
          }
          kickoffFreezeUntil.current = now + 2000
          audioManager.play('whistle')
        }
      }
    }

    // Update home AI players imperatively (no React re-render)
    for (let i = 0; i < homeResults.length; i++) {
      const ref = homePlayerRefs.current[i]
      if (ref?.current) {
        const r = homeResults[i]
        ref.current.updateTransform(r.position[0], r.position[2], r.rotation)
        ref.current.setAnimation(r.animation)
      }
    }
    // Update away AI players imperatively (no React re-render)
    for (let i = 0; i < awayResults.length; i++) {
      const ref = awayPlayerRefs.current[i]
      if (ref?.current) {
        const r = awayResults[i]
        ref.current.updateTransform(r.position[0], r.position[2], r.rotation)
        ref.current.setAnimation(r.animation)
      }
    }
  })

  // Player 1 spawn position: striker position on their team
  const p1AttacksPositiveZ = player1Team === 'away'
  const p1StrikerPos = getRoleHomePosition('striker', MATCH_FIELD.halfWidth, MATCH_FIELD.halfLength, p1AttacksPositiveZ)
  const p2AttacksPositiveZ = player2Team === 'away'
  const p2StrikerPos = getRoleHomePosition('striker', MATCH_FIELD.halfWidth, MATCH_FIELD.halfLength, p2AttacksPositiveZ)

  // Player 1 wears their team's jersey
  const p2Jersey = player2Team === 'home' ? JERSEY_BLUE : JERSEY_RED

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[20, 40, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={isMobileDevice ? 512 : 2048}
        shadow-mapSize-height={isMobileDevice ? 512 : 2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <Skybox scene="soccer" />
      <fog attach="fog" args={['#87CEEB', 80, 150]} />

      <PhysicsProvider paused={gamePhase !== 'playing'}>
        <MatchField />

        {/* Goals — direction controls which way the net extends */}
        <MatchGoal position={[0, 0, -MATCH_FIELD.halfLength]} onGoalScored={handleGoalNegZ} direction={-1} />
        <MatchGoal position={[0, 0, MATCH_FIELD.halfLength]} onGoalScored={handleGoalPosZ} direction={1} />

        {/* Ball */}
        <MatchBall ballRef={ballRef} />

        {/* Player 1 avatar — spawns at striker position on chosen team */}
        <RigidBody
          ref={bodyRef}
          type="kinematicPosition"
          position={[p1StrikerPos.x, 0, p1StrikerPos.z]}
          colliders={false}
        >
          <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.8, 0]} />
          <group ref={avatarGroupRef}>
            <Suspense fallback={null}>
              <HytopiaAvatar key={skinUrl} skinUrl={skinUrl} animation={movementState} />
            </Suspense>
          </group>
        </RigidBody>

        {/* Player 2 avatar (2P mode only) */}
        {playerCount === 2 && (
          <RigidBody
            ref={bodyRef2}
            type="kinematicPosition"
            position={[p2StrikerPos.x, 0, p2StrikerPos.z]}
            colliders={false}
          >
            <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.8, 0]} />
            <group ref={avatarGroupRef2}>
              <Suspense fallback={null}>
                <HytopiaAvatar key={p2Jersey} skinUrl={p2Jersey} animation={movementState2} />
              </Suspense>
            </group>
          </RigidBody>
        )}

        {/* Home team AI (blue jerseys) */}
        {Array.from({ length: homePlayerCount }, (_, i) => (
          <AIPlayer
            key={`home-${i}`}
            ref={homePlayerRefs.current[i]}
            initialData={{
              position: [aiTargets.current.home[i]?.x ?? 0, 0, aiTargets.current.home[i]?.z ?? 0],
              rotation: 0,
              animation: 'idle',
            }}
            skinUrl={JERSEY_BLUE}
            hasPhysics={i === 0}
          />
        ))}

        {/* Away team AI (red jerseys) */}
        {Array.from({ length: awayPlayerCount }, (_, i) => (
          <AIPlayer
            key={`away-${i}`}
            ref={awayPlayerRefs.current[i]}
            initialData={{
              position: [aiTargets.current.away[i]?.x ?? 0, 0, aiTargets.current.away[i]?.z ?? 0],
              rotation: Math.PI,
              animation: 'idle',
            }}
            skinUrl={JERSEY_RED}
            hasPhysics={i === 0}
          />
        ))}
      </PhysicsProvider>

      {/* Goal celebration confetti */}
      {goalConfetti && <Confetti position={goalConfetti} count={80} />}
    </>
  )
}

export function SoccerMatch() {
  return <SoccerMatchGame />
}
