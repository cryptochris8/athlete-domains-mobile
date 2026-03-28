import type { Difficulty } from '@/types'
import { DIFFICULTY_TIERS } from '@/systems/difficultyTiers'

export interface HoleConfig {
  id: number
  name: string
  par: number
  teePosition: [number, number, number]
  holePosition: [number, number, number]
  courseWidth: number
  courseLength: number
  walls: { position: [number, number, number]; size: [number, number, number]; rotation?: [number, number, number] }[]
  obstacles: { type: 'windmill' | 'bumper' | 'ramp' | 'water'; position: [number, number, number]; size?: [number, number, number] }[]
  theme: 'safari' | 'space' | 'underwater'
  funFact: string
}

export const MINIGOLF_CONFIG = {
  ballRadius: 0.025,
  ballMass: 0.046,
  ballRestitution: 0.5,
  ballLinearDamping: 1.2,
  maxPuttPower: 18,
  minPuttPower: 0.3,
  holeSinkMaxSpeed: 2.0,
  holeRadius: 0.05,
  maxStrokes: 8,
  outOfBoundsY: -2,
  /** Extra margin beyond course edges before triggering OOB */
  oobMargin: 1.0,
  /** Minimum wall height to contain airborne balls from ramps */
  boundaryWallHeight: 0.5,
} as const

/** Pure function: check if ball is out of bounds for a given hole */
export function isBallOutOfBounds(
  ballX: number, ballY: number, ballZ: number,
  courseWidth: number, courseLength: number,
): boolean {
  if (ballY < MINIGOLF_CONFIG.outOfBoundsY) return true
  const halfW = courseWidth / 2 + MINIGOLF_CONFIG.oobMargin
  const halfL = courseLength / 2 + MINIGOLF_CONFIG.oobMargin
  return Math.abs(ballX) > halfW || Math.abs(ballZ) > halfL
}

export function getMinigolfConfig(difficulty: Difficulty) {
  const tier = DIFFICULTY_TIERS[difficulty].minigolf
  return {
    ...MINIGOLF_CONFIG,
    maxStrokes: tier.maxStrokes,
    parScale: tier.parScale,
  }
}

// Standard boundary template (proven to work on hole 1)
// All holes share these exact dimensions and outer walls.
const STD_WIDTH = 1.5
const STD_LENGTH = 7
const STD_TEE: [number, number, number] = [0, 0.03, 3]
const STD_HOLE: [number, number, number] = [0, -0.01, -3]
const STD_WALLS: HoleConfig['walls'] = [
  { position: [-0.8, 0.1, 0], size: [0.1, 0.2, 7] },
  { position: [0.8, 0.1, 0], size: [0.1, 0.2, 7] },
  { position: [0, 0.1, -3.55], size: [1.7, 0.2, 0.1] },
  { position: [0, 0.1, 3.55], size: [1.7, 0.2, 0.1] },
]

export const COURSES: HoleConfig[] = [
  // Course 1: Animal Safari (holes 1-3)
  {
    id: 1, name: 'Straight Shot', par: 2, theme: 'safari',
    teePosition: STD_TEE, holePosition: STD_HOLE,
    courseWidth: STD_WIDTH, courseLength: STD_LENGTH,
    walls: [...STD_WALLS],
    obstacles: [],
    funFact: 'A cheetah can sprint at 70 mph!',
  },
  {
    id: 2, name: 'Bumper Alley', par: 3, theme: 'safari',
    teePosition: STD_TEE, holePosition: STD_HOLE,
    courseWidth: STD_WIDTH, courseLength: STD_LENGTH,
    walls: [...STD_WALLS],
    obstacles: [
      { type: 'bumper', position: [0.3, 0.08, 0.5] },
      { type: 'bumper', position: [-0.3, 0.08, -1] },
    ],
    funFact: 'Elephants are the only animals that can\'t jump!',
  },
  {
    id: 3, name: 'Tunnel Run', par: 3, theme: 'safari',
    teePosition: STD_TEE, holePosition: STD_HOLE,
    courseWidth: STD_WIDTH, courseLength: STD_LENGTH,
    walls: [
      ...STD_WALLS,
      // Interior wall forces the ball to go around
      { position: [-0.1, 0.1, -0.5], size: [0.8, 0.2, 0.1] },
    ],
    obstacles: [],
    funFact: 'A group of flamingos is called a "flamboyance"!',
  },

  // Course 2: Space Adventure (holes 4-6)
  {
    id: 4, name: 'Asteroid Field', par: 3, theme: 'space',
    teePosition: STD_TEE, holePosition: STD_HOLE,
    courseWidth: STD_WIDTH, courseLength: STD_LENGTH,
    walls: [...STD_WALLS],
    obstacles: [
      { type: 'bumper', position: [-0.3, 0.08, 0] },
      { type: 'bumper', position: [0.3, 0.08, -1] },
      { type: 'bumper', position: [0, 0.08, -2] },
    ],
    funFact: 'There are more stars in the universe than grains of sand on Earth!',
  },
  {
    id: 5, name: 'Spinning Satellite', par: 4, theme: 'space',
    teePosition: STD_TEE, holePosition: STD_HOLE,
    courseWidth: STD_WIDTH, courseLength: STD_LENGTH,
    walls: [...STD_WALLS],
    obstacles: [
      { type: 'windmill', position: [0, 0, -0.5] },
    ],
    funFact: 'A day on Venus is longer than a year on Venus!',
  },
  {
    id: 6, name: 'Black Hole', par: 3, theme: 'space',
    teePosition: STD_TEE, holePosition: STD_HOLE,
    courseWidth: STD_WIDTH, courseLength: STD_LENGTH,
    walls: [...STD_WALLS],
    obstacles: [
      { type: 'water', position: [-0.3, 0, 0], size: [0.6, 0.01, 1.0] },
    ],
    funFact: 'Light from the Sun takes 8 minutes to reach Earth!',
  },

  // Course 3: Underwater World (holes 7-9)
  {
    id: 7, name: 'Coral Reef', par: 3, theme: 'underwater',
    teePosition: STD_TEE, holePosition: STD_HOLE,
    courseWidth: STD_WIDTH, courseLength: STD_LENGTH,
    walls: [...STD_WALLS],
    obstacles: [
      { type: 'bumper', position: [-0.3, 0.08, -0.5] },
      { type: 'bumper', position: [0.3, 0.08, -1.5] },
    ],
    funFact: 'The ocean covers more than 70% of Earth\'s surface!',
  },
  {
    id: 8, name: 'Whirlpool', par: 4, theme: 'underwater',
    teePosition: STD_TEE, holePosition: STD_HOLE,
    courseWidth: STD_WIDTH, courseLength: STD_LENGTH,
    walls: [...STD_WALLS],
    obstacles: [
      { type: 'windmill', position: [0, 0, -0.5] },
      { type: 'water', position: [0.3, 0, -2], size: [0.5, 0.01, 0.5] },
    ],
    funFact: 'Octopuses have three hearts and blue blood!',
  },
  {
    id: 9, name: 'Deep Dive', par: 4, theme: 'underwater',
    teePosition: STD_TEE, holePosition: STD_HOLE,
    courseWidth: STD_WIDTH, courseLength: STD_LENGTH,
    walls: [
      ...STD_WALLS,
      // Zigzag interior walls
      { position: [-0.1, 0.1, -0.5], size: [0.7, 0.2, 0.1] },
      { position: [0.1, 0.1, -1.8], size: [0.7, 0.2, 0.1] },
    ],
    obstacles: [
      { type: 'bumper', position: [0, 0.08, 0.5] },
    ],
    funFact: 'The deepest point in the ocean is the Mariana Trench at 36,000 feet!',
  },
]
