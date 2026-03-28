// Colors
export const COLORS = {
  primary: '#FF6B35',
  secondary: '#004E89',
  accent: '#F7C948',
  success: '#2ECC71',
  danger: '#E74C3C',
  white: '#FFFFFF',
  dark: '#1A1A2E',
  court: '#C68642',
  grass: '#4CAF50',
  lane: '#DEB887',
  sky: '#87CEEB',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
} as const

// Physics
export const PHYSICS = {
  gravity: [0, -9.81, 0] as [number, number, number],
  basketball: {
    mass: 0.62,
    restitution: 0.75,
    linearDamping: 0.3,
    radius: 0.12,
  },
  soccer: {
    mass: 0.45,
    restitution: 0.6,
    linearDamping: 0.2,
    angularDamping: 2.5,
    friction: 0.35,
    radius: 0.11,
    shotForce: 8,
    tackleForce: 12,
    tackleDurationMs: 600,
    stuckCheckMs: 2000,
  },
  bowling: {
    ballMass: 6.0,
    ballRestitution: 0.3,
    ballRadius: 0.109,
    pinMass: 0.4,
    pinRestitution: 0.45,
  },
  golf: {
    mass: 0.046,
    restitution: 0.5,
    linearDamping: 0.5,
    radius: 0.021,
  },
} as const

// Timing
export const TIMING = {
  basketballRoundSeconds: 90,
  basketballShots: 15,
  soccerKicks: 5,
  bowlingFrames: 10,
  golfHoles: 9,
  powerMeterSpeed: 2.0,
} as const

// Scoring thresholds for star ratings
export const STAR_THRESHOLDS = {
  basketball: { one: 15, two: 30, three: 50 } as const,
  soccer: { one: 1, two: 3, three: 5 } as const,
  bowling: { one: 30, two: 70, three: 120 } as const,
  minigolf: { one: 45, two: 36, three: 27 } as const,
  archery: { one: 30, two: 75, three: 150 } as const,
  football: { one: 30, two: 75, three: 150 } as const,
} as const

// Camera defaults
export const CAMERA = {
  fov: 60,
  near: 0.1,
  far: 500,
  defaultPosition: [0, 5, 10] as [number, number, number],
} as const

// Avatar options for player selection
export const AVATAR_OPTIONS = [
  { id: 1, name: 'Avatar 1', path: '/skins/avatars/1.png' },
  { id: 2, name: 'Avatar 2', path: '/skins/avatars/100.png' },
  { id: 3, name: 'Avatar 3', path: '/skins/avatars/250.png' },
  { id: 4, name: 'Avatar 4', path: '/skins/avatars/500.png' },
  { id: 5, name: 'Avatar 5', path: '/skins/avatars/750.png' },
  { id: 6, name: 'Avatar 6', path: '/skins/avatars/1000.png' },
  { id: 7, name: 'Avatar 7', path: '/skins/avatars/1500.png' },
  { id: 8, name: 'Avatar 8', path: '/skins/avatars/2000.png' },
  { id: 9, name: 'Avatar 9', path: '/skins/avatars/2500.png' },
  { id: 10, name: 'Avatar 10', path: '/skins/avatars/3000.png' },
] as const

export const DEFAULT_SKIN_ID = 1

/** Maps old skinId (1-10) from AVATAR_OPTIONS to actual edition numbers */
export const LEGACY_SKIN_MAP: Record<number, number> = {
  1: 1,
  2: 100,
  3: 250,
  4: 500,
  5: 750,
  6: 1000,
  7: 1500,
  8: 2000,
  9: 2500,
  10: 3000,
}

// Soccer match camera/movement constants (subset of original HUB config)
export const HUB = {
  worldSize: 80,
  playerSpeed: 6,
  sprintMultiplier: 1.8,
  playerHeight: 1.8,
  jumpVelocity: 8,
  gravity: 20,
  groundY: 0,
  cameraDistance: 7,
  cameraPitchDefault: 0.4,
  cameraPitchMin: 0.2,
  cameraPitchMax: 1.2,
  mouseSensitivity: 0.003,
  touchSensitivity: 0.008,
  cameraLerpSpeed: 0.3,
  movingCameraLerpSpeed: 0.5,
  cameraHeightOffset: 1.5,
  facingLerpSpeed: 0.25,
  idleFacingLerpSpeed: 0.04,
  npcInteractDistance: 4,
} as const

export type AvatarSport = 'soccer' | 'basketball' | 'football' | 'golf' | 'tennis' | 'rugby' | 'baseball' | 'other'

export const SPORT_TABS: { label: string; value: AvatarSport | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Soccer', value: 'soccer' },
  { label: 'Basketball', value: 'basketball' },
  { label: 'Football', value: 'football' },
  { label: 'Golf', value: 'golf' },
  { label: 'Tennis', value: 'tennis' },
  { label: 'Rugby', value: 'rugby' },
  { label: 'Baseball', value: 'baseball' },
]
