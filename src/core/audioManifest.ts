import type { SoundName, VoiceName, MusicName } from '@/core/AudioManager'

interface AudioManifestEntry {
  sounds: { name: SoundName; src: string }[]
  voices: { name: VoiceName; src: string }[]
  music: { name: MusicName; src: string }[]
}

/** Sounds loaded on app init — shared across all scenes */
export const COMMON_AUDIO: AudioManifestEntry = {
  sounds: [
    { name: 'correct', src: '/audio/sfx/correct.wav' },
    { name: 'wrong', src: '/audio/sfx/wrong.wav' },
    { name: 'click', src: '/audio/sfx/ui-button-click.mp3' },
    { name: 'switchFlip', src: '/audio/sfx/ui-switch-flip.mp3' },
    { name: 'notification', src: '/audio/sfx/ui-notification.mp3' },
    { name: 'grab', src: '/audio/sfx/ui-grab.mp3' },
    { name: 'place', src: '/audio/sfx/ui-place.mp3' },
    { name: 'star', src: '/audio/sfx/star.mp3' },
    { name: 'unlock', src: '/audio/sfx/unlock.mp3' },
    { name: 'confetti', src: '/audio/sfx/confetti.mp3' },
  ],
  voices: [
    { name: 'welcome', src: '/audio/voice/welcome.mp3' },
    { name: 'gameOver', src: '/audio/voice/game-over.mp3' },
    { name: 'streak', src: '/audio/voice/streak.mp3' },
  ],
  music: [
    { name: 'menu', src: '/audio/music/menu.wav' },
  ],
}

/** Per-scene audio — loaded when the scene is entered */
export const SCENE_AUDIO: Partial<Record<string, AudioManifestEntry>> = {
  basketball: {
    sounds: [
      { name: 'bounce', src: '/audio/sfx/bounce.mp3' },
      { name: 'swish', src: '/audio/sfx/swish.mp3' },
      { name: 'rimClang', src: '/audio/sfx/rimClang.mp3' },
      { name: 'crowd', src: '/audio/sfx/crowd.mp3' },
    ],
    voices: [
      { name: 'swish', src: '/audio/voice/swish.mp3' },
    ],
    music: [
      { name: 'basketball', src: '/audio/music/basketball.wav' },
    ],
  },
  soccer: {
    sounds: [
      { name: 'kick', src: '/audio/sfx/kick.mp3' },
      { name: 'goalCheer', src: '/audio/sfx/goalCheer.mp3' },
      { name: 'whistle', src: '/audio/sfx/whistle.mp3' },
      { name: 'tackle', src: '/audio/sfx/tackle.mp3' },
      { name: 'countdown', src: '/audio/sfx/countdown.mp3' },
      { name: 'ticking', src: '/audio/sfx/ticking.mp3' },
      { name: 'crowdCheer', src: '/audio/sfx/crowd/cheer.wav' },
      { name: 'crowdChant', src: '/audio/sfx/crowd/chant.wav' },
      { name: 'goalReaction', src: '/audio/sfx/crowd/goal-reaction.wav' },
      { name: 'stoppageTime', src: '/audio/sfx/crowd/stoppage-time.mp3' },
    ],
    voices: [
      { name: 'goal', src: '/audio/voice/goal.mp3' },
      { name: 'greatSave', src: '/audio/voice/great-save.mp3' },
      { name: 'whatAGoal', src: '/audio/voice/announcer/what-a-goal.wav' },
      { name: 'beautifulSave', src: '/audio/voice/announcer/beautiful-save.wav' },
      { name: 'onFire', src: '/audio/voice/announcer/on-fire.wav' },
      { name: 'nearMiss', src: '/audio/voice/announcer/near-miss.wav' },
      { name: 'crowdGoesWild', src: '/audio/voice/announcer/crowd-goes-wild.wav' },
      { name: 'whatAShot', src: '/audio/voice/announcer/what-a-shot.wav' },
      { name: 'soClose', src: '/audio/voice/announcer/so-close.wav' },
      { name: 'whatABeauty', src: '/audio/voice/announcer/what-a-beauty.wav' },
      { name: 'gameStart', src: '/audio/voice/announcer/game-start.wav' },
      { name: 'itsAllOver', src: '/audio/voice/announcer/its-all-over.wav' },
      { name: 'onARoll', src: '/audio/voice/announcer/on-a-roll.wav' },
    ],
    music: [
      { name: 'soccer', src: '/audio/music/always-win.mp3' },
    ],
  },
  bowling: {
    sounds: [
      { name: 'bowlRoll', src: '/audio/sfx/bowlRoll.mp3' },
      { name: 'pinCrash', src: '/audio/sfx/pinCrash.mp3' },
    ],
    voices: [
      { name: 'strike', src: '/audio/voice/strike.mp3' },
      { name: 'spare', src: '/audio/voice/spare.mp3' },
    ],
    music: [
      { name: 'bowling', src: '/audio/music/bowling.wav' },
    ],
  },
  minigolf: {
    sounds: [
      { name: 'putt', src: '/audio/sfx/putt.mp3' },
      { name: 'holeIn', src: '/audio/sfx/holeIn.mp3' },
      { name: 'splash', src: '/audio/sfx/splash.mp3' },
    ],
    voices: [
      { name: 'greatPutt', src: '/audio/voice/great-putt.mp3' },
    ],
    music: [
      { name: 'minigolf', src: '/audio/music/minigolf.wav' },
    ],
  },
  archery: {
    sounds: [
      { name: 'arrowShoot', src: '/audio/sfx/bounce.mp3' },
      { name: 'targetHit', src: '/audio/sfx/click.mp3' },
    ],
    voices: [
      { name: 'bullseye', src: '/audio/voice/swish.mp3' },
    ],
    music: [
      { name: 'archery', src: '/audio/music/archery.mp3' },
    ],
  },
  'soccer-match': {
    sounds: [
      { name: 'kick', src: '/audio/sfx/kick.mp3' },
      { name: 'goalCheer', src: '/audio/sfx/goalCheer.mp3' },
      { name: 'whistle', src: '/audio/sfx/whistle.mp3' },
      { name: 'tackle', src: '/audio/sfx/tackle.mp3' },
      { name: 'countdown', src: '/audio/sfx/countdown.mp3' },
      { name: 'ticking', src: '/audio/sfx/ticking.mp3' },
      { name: 'crowdCheer', src: '/audio/sfx/crowd/cheer.wav' },
      { name: 'crowdChant', src: '/audio/sfx/crowd/chant.wav' },
      { name: 'goalReaction', src: '/audio/sfx/crowd/goal-reaction.wav' },
      { name: 'stoppageTime', src: '/audio/sfx/crowd/stoppage-time.mp3' },
    ],
    voices: [
      { name: 'goal', src: '/audio/voice/goal.mp3' },
      { name: 'greatSave', src: '/audio/voice/great-save.mp3' },
      { name: 'whatAGoal', src: '/audio/voice/announcer/what-a-goal.wav' },
      { name: 'beautifulSave', src: '/audio/voice/announcer/beautiful-save.wav' },
      { name: 'onFire', src: '/audio/voice/announcer/on-fire.wav' },
      { name: 'nearMiss', src: '/audio/voice/announcer/near-miss.wav' },
      { name: 'crowdGoesWild', src: '/audio/voice/announcer/crowd-goes-wild.wav' },
      { name: 'whatAShot', src: '/audio/voice/announcer/what-a-shot.wav' },
      { name: 'soClose', src: '/audio/voice/announcer/so-close.wav' },
      { name: 'whatABeauty', src: '/audio/voice/announcer/what-a-beauty.wav' },
      { name: 'gameStart', src: '/audio/voice/announcer/game-start.wav' },
      { name: 'itsAllOver', src: '/audio/voice/announcer/its-all-over.wav' },
      { name: 'onARoll', src: '/audio/voice/announcer/on-a-roll.wav' },
    ],
    music: [
      { name: 'soccer', src: '/audio/music/always-win.mp3' },
    ],
  },
  football: {
    sounds: [
      { name: 'arrowShoot', src: '/audio/sfx/bounce.mp3' },
      { name: 'targetHit', src: '/audio/sfx/click.mp3' },
      { name: 'crowd', src: '/audio/sfx/crowd.mp3' },
      { name: 'interception', src: '/audio/sfx/whistle.mp3' },
      { name: 'crowdCheer', src: '/audio/sfx/crowd/cheer.wav' },
      { name: 'goalReaction', src: '/audio/sfx/crowd/goal-reaction.wav' },
    ],
    voices: [
      { name: 'bullseye', src: '/audio/voice/swish.mp3' },
      { name: 'whatAShot', src: '/audio/voice/announcer/what-a-shot.wav' },
      { name: 'onFire', src: '/audio/voice/announcer/on-fire.wav' },
      { name: 'onARoll', src: '/audio/voice/announcer/on-a-roll.wav' },
      { name: 'crowdGoesWild', src: '/audio/voice/announcer/crowd-goes-wild.wav' },
    ],
    music: [
      { name: 'football', src: '/audio/music/football.mp3' },
    ],
  },
}
