import { useEffect, useRef } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGameStore } from '@/stores/useGameStore'
import { audioManager } from '@/core/AudioManager'
import { COMMON_AUDIO, SCENE_AUDIO } from '@/core/audioManifest'

/**
 * Syncs the settings store volume values to the AudioManager singleton.
 * Loads common audio on first mount; loads scene-specific audio when scene changes.
 * Call once at the app root level.
 */
export function useAudioSync() {
  const sfxVolume = useSettingsStore((s) => s.sfxVolume)
  const musicVolume = useSettingsStore((s) => s.musicVolume)
  const voiceVolume = useSettingsStore((s) => s.voiceVolume)
  const currentScene = useGameStore((s) => s.currentScene)
  const loaded = useRef(false)
  const loadedScenes = useRef(new Set<string>())

  // Load common audio once on mount
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    for (const s of COMMON_AUDIO.sounds) audioManager.loadSound(s.name, s.src)
    for (const v of COMMON_AUDIO.voices) audioManager.loadVoice(v.name, v.src)
    for (const m of COMMON_AUDIO.music) audioManager.loadMusic(m.name, m.src)
  }, [])

  // Load scene-specific audio when scene changes
  useEffect(() => {
    if (currentScene === 'menu') return
    if (loadedScenes.current.has(currentScene)) return

    const manifest = SCENE_AUDIO[currentScene]
    if (!manifest) return

    loadedScenes.current.add(currentScene)

    for (const s of manifest.sounds) {
      if (!audioManager.isSoundLoaded(s.name)) {
        audioManager.loadSound(s.name, s.src)
      }
    }
    for (const v of manifest.voices) {
      if (!audioManager.isSoundLoaded(v.name)) {
        audioManager.loadVoice(v.name, v.src)
      }
    }
    for (const m of manifest.music) {
      if (!audioManager.isSoundLoaded(m.name)) {
        audioManager.loadMusic(m.name, m.src)
      }
    }
  }, [currentScene])

  useEffect(() => {
    audioManager.setSfxVolume(sfxVolume)
  }, [sfxVolume])

  useEffect(() => {
    audioManager.setMusicVolume(musicVolume)
  }, [musicVolume])

  useEffect(() => {
    audioManager.setVoiceVolume(voiceVolume)
  }, [voiceVolume])
}
