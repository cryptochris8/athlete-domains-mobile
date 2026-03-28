import { Canvas } from '@react-three/fiber'
import { Suspense, type ReactNode } from 'react'
import { CAMERA } from './constants'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useMobileStore } from '@/stores/useMobileStore'

const QUALITY_SETTINGS = {
  low:    { dpr: [1, 1]   as [number, number], shadows: false, antialias: false },
  medium: { dpr: [1, 1.5] as [number, number], shadows: true,  antialias: false },
  high:   { dpr: [1, 2]   as [number, number], shadows: true,  antialias: true  },
} as const

interface GameCanvasProps {
  children: ReactNode
}

export function GameCanvas({ children }: GameCanvasProps) {
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality)
  const isMobile = useMobileStore((s) => s.isMobile)
  const quality = QUALITY_SETTINGS[graphicsQuality]

  // Mobile: cap DPR at 1.5 (high-DPI mobile screens don't need full 2-3x rendering)
  // Mobile: disable antialias regardless of quality (GPU-expensive on mobile, high DPI compensates)
  const dpr: [number, number] = isMobile
    ? [quality.dpr[0], Math.min(quality.dpr[1], 1.5)]
    : quality.dpr
  const antialias = isMobile ? false : quality.antialias

  return (
    <Canvas
      shadows={quality.shadows}
      dpr={dpr}
      camera={{
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
        position: CAMERA.defaultPosition,
      }}
      gl={{
        antialias,
        powerPreference: 'high-performance',
      }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </Canvas>
  )
}
