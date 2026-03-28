import { lazy, type ComponentType } from 'react'
import type { Scene } from '@/types'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export interface GameEntry {
  scene: ComponentType
  overlay?: ComponentType
  music?: string
  mobileControls?: { joystick?: boolean; actionButtons?: boolean }
}

const Basketball = lazy(() => import('@/scenes/Basketball').then((m) => ({ default: m.Basketball })))
const Soccer = lazy(() => import('@/scenes/Soccer').then((m) => ({ default: m.Soccer })))
const Bowling = lazy(() => import('@/scenes/Bowling').then((m) => ({ default: m.Bowling })))
const MiniGolf = lazy(() => import('@/scenes/MiniGolf').then((m) => ({ default: m.MiniGolf })))
const Archery = lazy(() => import('@/scenes/Archery').then((m) => ({ default: m.Archery })))
const Football = lazy(() => import('@/scenes/Football').then((m) => ({ default: m.Football })))
const SoccerMatch = lazy(() => import('@/scenes/SoccerMatch').then((m) => ({ default: m.SoccerMatch })))

// Overlay imports are small DOM components - no need to lazy-load
import { BasketballOverlay } from '@/ui/BasketballUI'
import { SoccerOverlay } from '@/ui/SoccerUI'
import { BowlingOverlay } from '@/ui/BowlingUI'
import { MinigolfOverlay } from '@/ui/MinigolfUI'
import { ArcheryOverlay } from '@/ui/ArcheryUI'
import { FootballOverlay } from '@/ui/FootballUI'
import { SoccerMatchOverlay } from '@/ui/SoccerMatchUI'

// Wrap a scene component with a Canvas-safe ErrorBoundary (renders null on error, not DOM)
function withErrorBoundary(Component: ComponentType, gameName: string): ComponentType {
  const Wrapped = () => (
    <ErrorBoundary gameName={gameName} canvasSafe>
      <Component />
    </ErrorBoundary>
  )
  Wrapped.displayName = `ErrorBoundary(${gameName})`
  return Wrapped
}

export const GAME_REGISTRY: Partial<Record<Scene, GameEntry>> = {
  basketball: { scene: withErrorBoundary(Basketball, 'Basketball'), overlay: BasketballOverlay, music: 'basketball', mobileControls: { joystick: true, actionButtons: true } },
  soccer: { scene: withErrorBoundary(Soccer, 'Soccer'), overlay: SoccerOverlay, music: 'soccer', mobileControls: { joystick: true, actionButtons: true } },
  bowling: { scene: withErrorBoundary(Bowling, 'Bowling'), overlay: BowlingOverlay, music: 'bowling', mobileControls: { joystick: true, actionButtons: true } },
  minigolf: { scene: withErrorBoundary(MiniGolf, 'Minigolf'), overlay: MinigolfOverlay, music: 'minigolf' },
  archery: { scene: withErrorBoundary(Archery, 'Archery'), overlay: ArcheryOverlay, music: 'archery' },
  football: { scene: withErrorBoundary(Football, 'Football'), overlay: FootballOverlay, music: 'football' },
  'soccer-match': { scene: withErrorBoundary(SoccerMatch, 'SoccerMatch'), overlay: SoccerMatchOverlay, music: 'soccer', mobileControls: { joystick: true, actionButtons: true } },
}
