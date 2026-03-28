import { audioManager } from '@/core/AudioManager'
import type { VoiceName } from '@/core/AudioManager'

const GOAL_VOICES: VoiceName[] = ['whatAGoal', 'whatABeauty', 'crowdGoesWild', 'whatAShot']
const NEAR_MISS_VOICES: VoiceName[] = ['nearMiss', 'soClose']
const MOMENTUM_VOICES: VoiceName[] = ['onFire', 'onARoll']

const ANNOUNCER_COOLDOWN_MS = 4000

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export class SoccerCrowdManager {
  private isActive = false
  private lastAnnouncerTime = 0
  private homeStreak = 0
  private awayStreak = 0
  private lastScoringTeam: 'home' | 'away' | null = null

  start(): void {
    this.isActive = true
    this.reset()
  }

  stop(): void {
    this.isActive = false
    this.reset()
  }

  private reset(): void {
    this.lastAnnouncerTime = 0
    this.homeStreak = 0
    this.awayStreak = 0
    this.lastScoringTeam = null
  }

  private canPlayAnnouncer(): boolean {
    return performance.now() - this.lastAnnouncerTime >= ANNOUNCER_COOLDOWN_MS
  }

  private playAnnouncerVoice(name: VoiceName): void {
    if (!this.canPlayAnnouncer()) return
    audioManager.playVoice(name)
    this.lastAnnouncerTime = performance.now()
  }

  onMatchStart(): void {
    if (!this.isActive) return
    audioManager.play('crowdCheer')
    this.playAnnouncerVoice('gameStart')
  }

  onGoalScored(team: 'home' | 'away'): void {
    if (!this.isActive) return

    // Track streaks
    if (team === this.lastScoringTeam) {
      if (team === 'home') this.homeStreak++
      else this.awayStreak++
    } else {
      this.homeStreak = team === 'home' ? 1 : 0
      this.awayStreak = team === 'away' ? 1 : 0
      this.lastScoringTeam = team
    }

    // SFX
    audioManager.play('goalReaction')
    audioManager.play('crowdCheer')

    // Check momentum first (2+ consecutive goals)
    const streak = team === 'home' ? this.homeStreak : this.awayStreak
    if (streak >= 2) {
      this.playAnnouncerVoice(pickRandom(MOMENTUM_VOICES))
    } else {
      this.playAnnouncerVoice(pickRandom(GOAL_VOICES))
    }
  }

  onNearMiss(): void {
    if (!this.isActive) return
    audioManager.play('crowdChant')
    this.playAnnouncerVoice(pickRandom(NEAR_MISS_VOICES))
  }

  onSave(): void {
    if (!this.isActive) return
    audioManager.play('crowdCheer')
    this.playAnnouncerVoice('beautifulSave')
  }

  onMatchEnd(): void {
    if (!this.isActive) return
    audioManager.play('crowdCheer')
    this.playAnnouncerVoice('itsAllOver')
  }

  onHalftime(): void {
    if (!this.isActive) return
    // Whistle is already played by the match timer; just add crowd
    audioManager.play('crowdChant')
  }

  onStoppageTime(): void {
    if (!this.isActive) return
    audioManager.play('stoppageTime')
  }
}
