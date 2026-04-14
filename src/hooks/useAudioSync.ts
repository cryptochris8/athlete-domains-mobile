import { useEffect, useRef } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGameStore } from '@/stores/useGameStore'
import { audioManager } from '@/core/AudioManager'
import { COMMON_AUDIO, SCENE_AUDIO } from '@/core/audioManifest'

/**
 * Syncs the settings store volume values to the AudioManager singleton.
 * Loads common audio on first mount; loads scene-specific audio when scene changes.
 * Unloads previous scene audio to prevent memory leaks.
 * Call once at the app root level.
 */
export function useAudioSync() {
  const sfxVolume = useSettingsStore((s) => s.sfxVolume)
  const musicVolume = useSettingsStore((s) => s.musicVolume)
  const voiceVolume = useSettingsStore((s) => s.voiceVolume)
  const currentScene = useGameStore((s) => s.currentScene)
  const loaded = useRef(false)
  const previousScene = useRef<string | null>(null)

  // Load common audio once on mount
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    for (const s of COMMON_AUDIO.sounds) audioManager.loadSound(s.name, s.src)
    for (const v of COMMON_AUDIO.voices) audioManager.loadVoice(v.name, v.src)
    for (const m of COMMON_AUDIO.music) audioManager.loadMusic(m.name, m.src)
  }, [])

  // Load scene-specific audio when scene changes; unload previous scene audio
  useEffect(() => {
    // Unload previous scene's audio to free memory
    const prev = previousScene.current
    if (prev && prev !== 'menu' && prev !== currentScene) {
      const prevManifest = SCENE_AUDIO[prev]
      if (prevManifest) {
        // Only unload sounds/voices that aren't also in common audio
        const commonSoundNames = new Set(COMMON_AUDIO.sounds.map((s) => s.name))
        const commonVoiceNames = new Set(COMMON_AUDIO.voices.map((v) => v.name))
        const commonMusicNames = new Set(COMMON_AUDIO.music.map((m) => m.name))

        for (const s of prevManifest.sounds) {
          if (!commonSoundNames.has(s.name)) audioManager.unloadSound(s.name)
        }
        for (const v of prevManifest.voices) {
          if (!commonVoiceNames.has(v.name)) audioManager.unloadVoice(v.name)
        }
        for (const m of prevManifest.music) {
          if (!commonMusicNames.has(m.name)) audioManager.unloadMusic(m.name)
        }
      }
    }
    previousScene.current = currentScene

    // Load current scene audio
    if (currentScene === 'menu') return

    const manifest = SCENE_AUDIO[currentScene]
    if (!manifest) return

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
