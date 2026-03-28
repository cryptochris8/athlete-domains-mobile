import { Howl } from 'howler'
import type { SportKey } from '@/types'

type SoundName =
  | 'bounce'
  | 'swish'
  | 'rimClang'
  | 'crowd'
  | 'kick'
  | 'goalCheer'
  | 'whistle'
  | 'bowlRoll'
  | 'pinCrash'
  | 'strike'
  | 'putt'
  | 'holeIn'
  | 'splash'
  | 'correct'
  | 'wrong'
  | 'click'
  | 'switchFlip'
  | 'notification'
  | 'grab'
  | 'place'
  | 'star'
  | 'unlock'
  | 'confetti'
  | 'arrowShoot'
  | 'targetHit'
  | 'interception'
  | 'tackle'
  | 'countdown'
  | 'ticking'
  | 'crowdCheer'
  | 'crowdChant'
  | 'goalReaction'
  | 'stoppageTime'

type VoiceName =
  | 'welcome'
  | 'swish'
  | 'goal'
  | 'strike'
  | 'spare'
  | 'greatPutt'
  | 'greatSave'
  | 'gameOver'
  | 'quizTime'
  | 'quizCorrect'
  | 'quizWrong'
  | 'streak'
  | 'bullseye'
  | 'whatAGoal'
  | 'beautifulSave'
  | 'onFire'
  | 'nearMiss'
  | 'crowdGoesWild'
  | 'whatAShot'
  | 'soClose'
  | 'whatABeauty'
  | 'gameStart'
  | 'itsAllOver'
  | 'onARoll'

type MusicName = 'menu' | 'hub' | SportKey

class AudioManager {
  private sounds: Map<string, Howl> = new Map()
  private music: Map<string, Howl> = new Map()
  private voices: Map<string, Howl> = new Map()
  private currentMusic: string | null = null
  private lastMusic: string | null = null
  private currentVoice: Howl | null = null
  private _sfxVolume = 0.7
  private _musicVolume = 0.4
  private _voiceVolume = 0.85
  private fadeTimer: ReturnType<typeof setTimeout> | null = null

  get sfxVolume() {
    return this._sfxVolume
  }

  get musicVolume() {
    return this._musicVolume
  }

  get voiceVolume() {
    return this._voiceVolume
  }

  setSfxVolume(vol: number) {
    this._sfxVolume = vol
    this.sounds.forEach((s) => s.volume(vol))
  }

  setMusicVolume(vol: number) {
    this._musicVolume = vol
    this.music.forEach((m) => m.volume(vol))
  }

  setVoiceVolume(vol: number) {
    this._voiceVolume = vol
    this.voices.forEach((v) => v.volume(vol))
  }

  loadSound(name: SoundName, src: string) {
    const sound = new Howl({ src: [src], volume: this._sfxVolume })
    this.sounds.set(name, sound)
  }

  loadMusic(name: MusicName, src: string) {
    const m = new Howl({ src: [src], volume: this._musicVolume, loop: true })
    this.music.set(name, m)
  }

  loadVoice(name: VoiceName, src: string) {
    const v = new Howl({ src: [src], volume: this._voiceVolume })
    this.voices.set(name, v)
  }

  unloadSound(name: SoundName) {
    const s = this.sounds.get(name)
    if (s) {
      s.unload()
      this.sounds.delete(name)
    }
  }

  unloadVoice(name: VoiceName) {
    const v = this.voices.get(name)
    if (v) {
      v.unload()
      this.voices.delete(name)
    }
  }

  unloadMusic(name: MusicName) {
    const m = this.music.get(name)
    if (m) {
      if (this.currentMusic === name) {
        m.stop()
        this.currentMusic = null
      }
      m.unload()
      this.music.delete(name)
    }
  }

  isSoundLoaded(name: string): boolean {
    return this.sounds.has(name) || this.voices.has(name) || this.music.has(name)
  }

  play(name: SoundName) {
    this.sounds.get(name)?.play()
  }

  stop(name: SoundName) {
    this.sounds.get(name)?.stop()
  }

  playWithPitch(name: SoundName, pitchMultiplier: number) {
    const sound = this.sounds.get(name)
    if (sound) {
      sound.rate(pitchMultiplier)
      sound.play()
    }
  }

  playVoice(name: VoiceName) {
    // Stop any currently playing voice to avoid overlap
    if (this.currentVoice && this.currentVoice.playing()) {
      this.currentVoice.stop()
    }
    const v = this.voices.get(name)
    if (v) {
      v.play()
      this.currentVoice = v
    }
  }

  private cancelPendingFade() {
    if (this.fadeTimer !== null) {
      clearTimeout(this.fadeTimer)
      this.fadeTimer = null
    }
  }

  playMusic(name: MusicName) {
    if (this.currentMusic === name) return
    this.cancelPendingFade()
    if (this.currentMusic) {
      const prev = this.music.get(this.currentMusic)
      if (prev) {
        prev.stop()
      }
    }
    const m = this.music.get(name)
    if (m) {
      m.volume(0)
      m.play()
      m.fade(0, this._musicVolume, 500)
      this.currentMusic = name
      this.lastMusic = name
    }
  }

  /** Resume the last-played music (e.g., after app returns from background) */
  resumeMusic() {
    if (this.lastMusic && !this.currentMusic) {
      this.playMusic(this.lastMusic as MusicName)
    }
  }

  stopMusic() {
    this.cancelPendingFade()
    if (this.currentMusic) {
      const prev = this.music.get(this.currentMusic)
      if (prev) {
        prev.fade(this._musicVolume, 0, 500)
        this.fadeTimer = setTimeout(() => {
          prev.stop()
          this.fadeTimer = null
        }, 500)
      }
      this.currentMusic = null
    }
  }

  stopAll() {
    this.sounds.forEach((s) => s.stop())
    this.voices.forEach((v) => v.stop())
    this.currentVoice = null
    this.stopMusic()
  }
}

export type { SoundName, VoiceName, MusicName }
export const audioManager = new AudioManager()
