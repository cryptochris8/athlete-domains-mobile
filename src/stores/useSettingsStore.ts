import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { detectTouch } from '@/utils/mobile'

type GraphicsQuality = 'low' | 'medium' | 'high'

const isMobileDevice = detectTouch()

interface SettingsState {
  sfxVolume: number
  musicVolume: number
  voiceVolume: number
  graphicsQuality: GraphicsQuality
  showTutorials: boolean
  setSfxVolume: (vol: number) => void
  setMusicVolume: (vol: number) => void
  setVoiceVolume: (vol: number) => void
  setGraphicsQuality: (q: GraphicsQuality) => void
  setShowTutorials: (show: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sfxVolume: 0.7,
      musicVolume: 0.4,
      voiceVolume: 0.85,
      graphicsQuality: isMobileDevice ? 'low' : 'high',
      showTutorials: true,

      setSfxVolume: (vol) => set({ sfxVolume: vol }),
      setMusicVolume: (vol) => set({ musicVolume: vol }),
      setVoiceVolume: (vol) => set({ voiceVolume: vol }),
      setGraphicsQuality: (q) => set({ graphicsQuality: q }),
      setShowTutorials: (show) => set({ showTutorials: show }),
    }),
    { name: 'three-j-settings' }
  )
)
