import { create } from 'zustand'
import { COURSES, MINIGOLF_CONFIG } from './config'

type GolfPhase = 'aiming' | 'rolling' | 'holed' | 'nexthole' | 'done'

interface MinigolfState {
  phase: GolfPhase
  currentHole: number
  strokes: number
  strokesPerHole: number[]
  totalStrokes: number
  dragStartX: number
  dragStartY: number
  dragEndX: number
  dragEndY: number
  isDragging: boolean

  lastBallPosition: [number, number, number]
  resetCounter: number
  hasGuideLine: boolean
  effectiveMaxStrokes: number
  lastEvent: string | null

  startDrag: (x: number, y: number) => void
  updateDrag: (x: number, y: number) => void
  releasePutt: () => { dirX: number; dirZ: number; power: number }
  saveBallPosition: (pos: [number, number, number]) => void
  ballStopped: () => void
  ballHoled: () => void
  waterHazard: () => void
  outOfBounds: () => void
  nextHole: () => void
  getCurrentHoleConfig: () => typeof COURSES[0]
  grantGuideLine: () => void
  resetGame: (maxStrokes?: number) => void
}

export const useMinigolf = create<MinigolfState>((set, get) => ({
  phase: 'aiming',
  currentHole: 0,
  strokes: 0,
  strokesPerHole: [],
  totalStrokes: 0,
  dragStartX: 0,
  dragStartY: 0,
  dragEndX: 0,
  dragEndY: 0,
  isDragging: false,
  lastBallPosition: COURSES[0].teePosition,
  resetCounter: 0,
  hasGuideLine: false,
  effectiveMaxStrokes: MINIGOLF_CONFIG.maxStrokes,
  lastEvent: null,

  startDrag: (x, y) => set({ isDragging: true, dragStartX: x, dragStartY: y, dragEndX: x, dragEndY: y }),

  updateDrag: (x, y) => set({ dragEndX: x, dragEndY: y }),

  releasePutt: () => {
    const { dragStartX, dragStartY, dragEndX, dragEndY, strokes } = get()
    const dx = dragStartX - dragEndX
    const dy = dragStartY - dragEndY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const power = Math.min(distance * 0.1, MINIGOLF_CONFIG.maxPuttPower)

    if (power < MINIGOLF_CONFIG.minPuttPower) {
      set({ isDragging: false })
      return { dirX: 0, dirZ: 0, power: 0 }
    }

    const dirX = dx / (distance || 1)
    const dirZ = dy / (distance || 1)

    set({
      phase: 'rolling',
      isDragging: false,
      strokes: strokes + 1,
      hasGuideLine: false,
    })

    return { dirX, dirZ, power }
  },

  saveBallPosition: (pos: [number, number, number]) => set({ lastBallPosition: pos }),

  ballStopped: () => {
    const { phase, strokes, effectiveMaxStrokes } = get()
    if (phase === 'rolling') {
      if (strokes >= effectiveMaxStrokes) {
        // Max strokes reached, move on
        set((s) => ({
          phase: 'holed',
          strokesPerHole: [...s.strokesPerHole, effectiveMaxStrokes],
          totalStrokes: s.totalStrokes + effectiveMaxStrokes,
        }))
      } else {
        set({ phase: 'aiming' })
      }
    }
  },

  ballHoled: () => {
    const { strokes } = get()
    set((s) => ({
      phase: 'holed',
      strokesPerHole: [...s.strokesPerHole, strokes],
      totalStrokes: s.totalStrokes + strokes,
    }))
  },

  waterHazard: () => {
    const { phase } = get()
    if (phase !== 'rolling') return
    // Add 1 penalty stroke and reset ball to lastBallPosition
    set((s) => ({
      phase: 'aiming',
      strokes: s.strokes + 1,
      resetCounter: s.resetCounter + 1,
    }))
  },

  outOfBounds: () => {
    const { phase } = get()
    if (phase !== 'rolling') return
    // Reset ball to lastBallPosition (no penalty)
    set((s) => ({
      phase: 'aiming',
      resetCounter: s.resetCounter + 1,
      lastEvent: 'oob',
    }))
  },

  nextHole: () => {
    const { currentHole } = get()
    if (currentHole >= COURSES.length - 1) {
      set({ phase: 'done' })
    } else {
      const nextHoleIdx = currentHole + 1
      set((s) => ({
        currentHole: nextHoleIdx,
        phase: 'aiming',
        strokes: 0,
        isDragging: false,
        hasGuideLine: false,
        lastBallPosition: COURSES[nextHoleIdx].teePosition,
        resetCounter: s.resetCounter + 1,
      }))
    }
  },

  getCurrentHoleConfig: () => COURSES[get().currentHole],

  grantGuideLine: () => set({ hasGuideLine: true }),

  resetGame: (maxStrokes?: number) => set({
    phase: 'aiming',
    currentHole: 0,
    strokes: 0,
    strokesPerHole: [],
    totalStrokes: 0,
    dragStartX: 0,
    dragStartY: 0,
    dragEndX: 0,
    dragEndY: 0,
    isDragging: false,
    hasGuideLine: false,
    lastBallPosition: COURSES[0].teePosition,
    effectiveMaxStrokes: maxStrokes ?? MINIGOLF_CONFIG.maxStrokes,
    lastEvent: null,
  }),
}))
