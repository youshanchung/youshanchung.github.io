/**
 * Voice cue manager.
 *
 * Four workout milestones each get a short pre-recorded human-voice line, in
 * both languages (assets/sounds/*.wav — synthesized once via Windows SAPI,
 * female voices: Zira for English, Hanhan for Traditional Chinese):
 *   - beforeStart: "Three, two, one, go!" — last 3s before any 'work' phase
 *   - halfway:     "Halfway there."       — once, at 50% of total workout time
 *   - beforeRest:  "Three, two, one, rest!" — last 3s before 'rest'/'cycleRest'
 *   - finished:    "Workout finished."    — once, when the schedule ends
 *
 * Haptics still fire alongside on native (silent no-op on web, same as
 * before — there's no vibration API exposed to browsers).
 */

import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Haptics from 'expo-haptics';
import type { Lang } from '@/i18n/strings';

type CueKey = 'beforeStart' | 'halfway' | 'beforeRest' | 'finished';

// Metro needs `require()` calls to look statically resolvable, so this can't
// be built from a template string — spell out all 8 explicitly.
const CUE_FILES: Record<CueKey, Record<Lang, number>> = {
  beforeStart: {
    en: require('../../assets/sounds/before_start_en.wav'),
    zh: require('../../assets/sounds/before_start_zh.wav'),
  },
  halfway: {
    en: require('../../assets/sounds/halfway_en.wav'),
    zh: require('../../assets/sounds/halfway_zh.wav'),
  },
  beforeRest: {
    en: require('../../assets/sounds/before_rest_en.wav'),
    zh: require('../../assets/sounds/before_rest_zh.wav'),
  },
  finished: {
    en: require('../../assets/sounds/finished_en.wav'),
    zh: require('../../assets/sounds/finished_zh.wav'),
  },
};

let audioModeConfigured = false;
const soundCache = new Map<string, Audio.Sound>(); // key: `${cue}:${lang}`
let loadingAll: Promise<void> | null = null;

function cacheKey(cue: CueKey, lang: Lang) {
  return `${cue}:${lang}`;
}

async function ensureSoundsLoaded() {
  if (loadingAll) return loadingAll;
  loadingAll = (async () => {
    const cues = Object.keys(CUE_FILES) as CueKey[];
    const langs: Lang[] = ['en', 'zh'];
    await Promise.all(
      cues.flatMap((cue) =>
        langs.map(async (lang) => {
          try {
            const { sound } = await Audio.Sound.createAsync(CUE_FILES[cue][lang]);
            soundCache.set(cacheKey(cue, lang), sound);
          } catch {
            // That one clip stays silent; the rest still work.
          }
        })
      )
    );
  })();
  return loadingAll;
}

export async function configureAudio() {
  if (!audioModeConfigured) {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      });
      audioModeConfigured = true;
    } catch {
      // not fatal
    }
  }
  await ensureSoundsLoaded();
}

/**
 * Play every cue once, silently, right now. Browsers only allow audio
 * playback that's triggered by (or very close to) a real user tap — calling
 * this from the "Start" button's onPress unlocks all 8 clips for the rest of
 * the workout, before the timer starts calling them on its own.
 */
export async function primeAudio() {
  try {
    await ensureSoundsLoaded();
    for (const s of soundCache.values()) {
      await s.setVolumeAsync(0);
      await s.replayAsync();
      await s.stopAsync();
      await s.setVolumeAsync(1);
    }
  } catch {
    // not fatal — worst case, cues stay silent on a strict browser
  }
}

async function playCue(cue: CueKey, lang: Lang) {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
  try {
    await soundCache.get(cacheKey(cue, lang))?.replayAsync();
  } catch {}
}

/** Last 3 seconds before a 'work' phase starts (first exercise, or any exercise after a rest). */
export const playBeforeStartCue = (lang: Lang) => playCue('beforeStart', lang);
/** Once, when total elapsed time crosses 50% of the whole workout. */
export const playHalfwayCue = (lang: Lang) => playCue('halfway', lang);
/** Last 3 seconds before a 'rest' or 'cycleRest' phase starts. */
export const playBeforeRestCue = (lang: Lang) => playCue('beforeRest', lang);
/** Once, when the entire schedule (all cycles) completes. */
export const playFinishedCue = (lang: Lang) => playCue('finished', lang);
