import { useThree } from '@react-three/fiber'
import { useTexture, Environment } from '@react-three/drei'
import { useEffect } from 'react'
import { EquirectangularReflectionMapping, RepeatWrapping } from 'three'
import type { Scene } from '@/types'

/**
 * Skybox configuration per game scene.
 *
 * To add a custom skybox from Blockade Labs:
 * 1. Generate a skybox at https://skybox.blockadelabs.com/
 * 2. Download the equirectangular panorama image (JPG/PNG)
 * 3. Place it in public/skyboxes/ with the filename matching below
 * 4. Set `file` to the filename (e.g. 'basketball.jpg')
 *
 * If no custom file exists, the drei Environment preset is used as fallback.
 */
export const SKYBOX_CONFIG: Record<string, {
  file?: string
  preset: 'park' | 'warehouse' | 'night' | 'sunset' | 'dawn' | 'city' | 'forest' | 'apartment' | 'studio' | 'lobby'
  backgroundBlurriness?: number
  backgroundIntensity?: number
  rotation?: number // 0-1 horizontal rotation (0.25 = 90°, 0.5 = 180°)
}> = {
  hub: {
    file: 'hub.jpg',
    preset: 'park',
    backgroundBlurriness: 0,
    backgroundIntensity: 1,
  },
  basketball: {
    file: 'basketball.jpg',
    preset: 'warehouse',
    backgroundBlurriness: 0,
    backgroundIntensity: 0.8,
  },
  soccer: {
    file: 'soccer.jpg',
    preset: 'park',
    backgroundBlurriness: 0,
    backgroundIntensity: 1,
    rotation: 0.125,
  },
  bowling: {
    file: 'bowling.jpg',
    preset: 'warehouse',
    backgroundBlurriness: 0,
    backgroundIntensity: 0.6,
  },
  minigolf: {
    file: 'minigolf.jpg',
    preset: 'park',
    backgroundBlurriness: 0,
    backgroundIntensity: 1,
  },
  archery: {
    file: 'archery.jpg',
    preset: 'forest',
    backgroundBlurriness: 0,
    backgroundIntensity: 1,
  },
  football: {
    file: 'football.jpg',
    preset: 'park',
    backgroundBlurriness: 0,
    backgroundIntensity: 1,
  },
}

interface SkyboxProps {
  scene: Scene
}

/**
 * Loads a custom equirectangular skybox image if available in public/skyboxes/.
 * Falls back to a drei Environment preset if the image doesn't exist.
 */
function CustomSkybox({ scene }: SkyboxProps) {
  const config = SKYBOX_CONFIG[scene]
  if (!config?.file) return <Environment preset={config?.preset ?? 'park'} />

  return <SkyboxLoader config={config} />
}

function SkyboxLoader({ config }: { config: typeof SKYBOX_CONFIG[string] }) {
  const { scene: threeScene } = useThree()

  // Try loading the custom texture
  // useTexture will throw if file doesn't exist, caught by ErrorBoundary
  const texture = useTexture(`/skyboxes/${config.file}`)

  useEffect(() => {
    texture.mapping = EquirectangularReflectionMapping
    if (config.rotation) {
      texture.wrapS = RepeatWrapping
      texture.offset.x = config.rotation
    }
    threeScene.background = texture
    threeScene.environment = texture
    threeScene.backgroundBlurriness = config.backgroundBlurriness ?? 0
    threeScene.backgroundIntensity = config.backgroundIntensity ?? 1

    return () => {
      threeScene.background = null
      threeScene.environment = null
      texture.dispose()
    }
  }, [texture, threeScene, config])

  return null
}

/**
 * Error boundary that falls back to preset Environment if texture fails to load.
 */
import { Component, type ReactNode } from 'react'

interface FallbackProps {
  preset: typeof SKYBOX_CONFIG[string]['preset']
  children: ReactNode
}

interface FallbackState {
  hasError: boolean
}

class SkyboxErrorBoundary extends Component<FallbackProps, FallbackState> {
  state: FallbackState = { hasError: false }

  static getDerivedStateFromError(): FallbackState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <Environment preset={this.props.preset} />
    }
    return this.props.children
  }
}

export function Skybox({ scene }: SkyboxProps) {
  const config = SKYBOX_CONFIG[scene] ?? { preset: 'park' }

  return (
    <SkyboxErrorBoundary preset={config.preset}>
      <CustomSkybox scene={scene} />
    </SkyboxErrorBoundary>
  )
}
