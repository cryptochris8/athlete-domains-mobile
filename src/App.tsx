import { Suspense, useEffect, useState } from 'react'
import { GameCanvas } from '@/core/GameCanvas'
import { useGameStore } from '@/stores/useGameStore'
import { useAudioSync } from '@/hooks/useAudioSync'
import { audioManager } from '@/core/AudioManager'
import type { MusicName } from '@/core/AudioManager'
import { GameSelectionMenu } from '@/ui/GameSelectionMenu'
import { PauseMenu } from '@/ui/PauseMenu'
import { TutorialOverlay } from '@/ui/TutorialOverlay'
import { HomeButton } from '@/ui/HomeButton'
import { AchievementToast } from '@/ui/AchievementToast'
import { GAME_REGISTRY } from '@/core/gameRegistry'
import { useTouchDevice } from '@/hooks/useTouchDevice'
import { MobileJoystick } from '@/ui/MobileJoystick'
import { MobileSoccerControls } from '@/ui/MobileSoccerControls'
import { hideSplashScreen } from '@/core/capacitor'
import { useDailyRewardStore } from '@/stores/useDailyRewardStore'
import { DailyRewardModal } from '@/ui/DailyRewardModal'

function SceneContent() {
  const currentScene = useGameStore((s) => s.currentScene)
  const entry = GAME_REGISTRY[currentScene]
  if (!entry) return null
  const SceneComponent = entry.scene
  return <SceneComponent />
}

function GameOverlay() {
  const currentScene = useGameStore((s) => s.currentScene)
  const entry = GAME_REGISTRY[currentScene]
  if (!entry?.overlay) return null
  const OverlayComponent = entry.overlay
  return <OverlayComponent />
}

function LoadingScreen() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1A1A2E',
      zIndex: 200,
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FF6B35' }}>
        Loading...
      </div>
    </div>
  )
}

const MENU_MUSIC: MusicName = 'menu'

export function App() {
  useAudioSync()
  const isMobile = useTouchDevice()
  const currentScene = useGameStore((s) => s.currentScene)
  const gamePhase = useGameStore((s) => s.gamePhase)
  const isLoading = useGameStore((s) => s.isLoading)
  const [showDailyReward, setShowDailyReward] = useState(false)

  // Hide native splash screen once app has loaded
  useEffect(() => {
    if (!isLoading) hideSplashScreen()
  }, [isLoading])

  // Auto-trigger daily reward modal on mount when on menu screen
  useEffect(() => {
    if (currentScene === 'menu' && useDailyRewardStore.getState().canClaim()) {
      setShowDailyReward(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Play background music for each scene
  useEffect(() => {
    const musicName = currentScene === 'menu'
      ? MENU_MUSIC
      : GAME_REGISTRY[currentScene]?.music as MusicName | undefined
    if (musicName) {
      audioManager.playMusic(musicName)
    }
  }, [currentScene])

  return (
    <>
      {currentScene === 'menu' ? (
        <GameSelectionMenu />
      ) : (
        <>
          <Suspense fallback={<LoadingScreen />}>
            <div style={{ touchAction: 'none', width: '100%', height: '100%' }}>
              <GameCanvas>
                <SceneContent />
              </GameCanvas>
            </div>
          </Suspense>
          {/* DOM overlays rendered OUTSIDE Canvas for reliable display */}
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 10,
            paddingTop: 'var(--safe-top, 0px)',
            paddingBottom: 'var(--safe-bottom, 0px)',
            paddingLeft: 'var(--safe-left, 0px)',
            paddingRight: 'var(--safe-right, 0px)',
          }}>
            <GameOverlay />
          </div>
          {/* Home button always visible when not on menu */}
          <HomeButton />
          {/* Mobile controls driven by registry mobileControls config */}
          {isMobile && gamePhase === 'playing' && GAME_REGISTRY[currentScene]?.mobileControls?.joystick && (
            <MobileJoystick />
          )}
          {isMobile && gamePhase === 'playing' && GAME_REGISTRY[currentScene]?.mobileControls?.actionButtons && (
            <MobileSoccerControls />
          )}
        </>
      )}

      {gamePhase === 'playing' && currentScene !== 'menu' && (
        <TutorialOverlay game={currentScene} />
      )}
      {gamePhase === 'paused' && <PauseMenu />}
      {isLoading && <LoadingScreen />}
      <AchievementToast />
      {showDailyReward && <DailyRewardModal onClose={() => setShowDailyReward(false)} />}
    </>
  )
}
