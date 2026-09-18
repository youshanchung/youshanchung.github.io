/**
 * Voice cue manager — audio-sprite design.
 *
 * All four workout milestones, both languages, live as segments inside ONE
 * combined file (assets/sounds/cues.wav — see cueSprite.ts for the offset/
 * duration of each segment), played through a SINGLE Audio.Sound/<audio>
 * element by seeking + playing + pausing at the right offsets.
 *
 * This replaces an earlier version that loaded each of the 8 clips as its
 * own separate Audio.Sound (its own underlying <audio> element). iOS
 * Safari's audio-unlock is per-element: a user gesture (the Start button tap)
 * has to durably unlock EVERY element that will ever play without a gesture
 * later. Priming 8 separate elements from one tap turned out to only
 * reliably unlock one or two of them in practice — everything else stayed
 * silent all workout, for every cycle, and halfway/finished never played.
 * With one element, there's only one thing to unlock, and once it's unlocked
 * it stays unlocked for the rest of the session regardless of how much later
 * a given cue fires.
 *
 * Haptics still fire alongside on native (silent no-op on web — there's no
 * vibration API exposed to browsers).
 */

import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Haptics from 'expo-haptics';
import type { Lang } from '@/i18n/strings';
import { CUE_SPRITE } from './cueSprite';

type CueKey = 'beforeStart' | 'halfway' | 'beforeRest' | 'finished' | 'cycleComplete';

let audioModeConfigured = false;
let sound: Audio.Sound | null = null;
let loadingPromise: Promise<void> | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;
// Every pause+seek+play "setup" sequence for a new segment is queued through
// this, one at a time — without it, two closely-timed calls (e.g. primeAudio
// firing on the Start tap at the same moment the very first countdown cue's
// trigger fires) can interleave their async steps on the shared element:
// call A's seek can land, then call B's seek overwrites it, then call A's
// *own* play() fires against B's (wrong) position. This was directly
// observed: the very first two play() calls both landed at beforeStart's
// position instead of one being at prime's position 0 as intended.
let opQueue: Promise<void> = Promise.resolve();
function enqueue(op: () => Promise<void>): Promise<void> {
  opQueue = opQueue.then(op, op);
  return opQueue;
}

async function ensureLoaded() {
  if (sound) return;
  if (!loadingPromise) {
    loadingPromise = (async () => {
      try {
        const { sound: s } = await Audio.Sound.createAsync(require('../../assets/sounds/cues.wav'));
        sound = s;
      } catch {
        // `sound` stays null; every playback call below becomes a no-op.
      }
    })();
  }
  await loadingPromise;
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
  await ensureLoaded();
}

function playSegment({ offsetMs, durationMs }: { offsetMs: number; durationMs: number }) {
  return enqueue(async () => {
    if (!sound) return;
    try {
      if (stopTimer) {
        clearTimeout(stopTimer);
        stopTimer = null;
      }
      // Explicitly pause before seeking, even though playAsync() below would
      // "interrupt" a still-playing previous segment anyway. If a cue's clip
      // is still actively playing when the next one needs to start (a short
      // work/rest interval can end before the previous ~3-4s voice line has
      // finished), seeking + playing on an element that's mid-playback is
      // exactly the kind of operation real iOS Safari has been known to drop
      // silently.
      await sound.pauseAsync().catch(() => {});
      await sound.setPositionAsync(offsetMs);
      await sound.playAsync();
      // There's no natural end-of-segment event mid-file, so schedule our own
      // stop — a little past the segment's real duration so we don't clip its
      // tail, but well before the next segment (which starts after a silence
      // gap) would otherwise start bleeding through.
      stopTimer = setTimeout(() => {
        sound?.pauseAsync().catch(() => {});
        stopTimer = null;
      }, durationMs + 80);
    } catch {
      // not fatal — worst case, this one cue stays silent
    }
  });
}

/**
 * Play the sprite's leading true-silence segment once, right now, then stop.
 * Calling this from the "Start" button's onPress is meant to unlock the
 * single underlying <audio> element for the whole rest of the workout.
 *
 * This plays real (unmuted, full-volume) silence rather than muting the
 * element or zeroing its volume: browsers specifically exempt muted/
 * zero-volume playback from the autoplay-gesture requirement in the first
 * place (that's the whole reason `<video autoplay muted>` doesn't need one),
 * which means a muted "priming" attempt wouldn't actually grant a lasting
 * unlock — nothing was ever restricted to unlock. Because the *content* of
 * this segment is silence, priming stays completely inaudible while still
 * being a fully legitimate, unlock-granting play() call.
 */
export async function primeAudio() {
  try {
    await ensureLoaded();
    await playSegment(CUE_SPRITE.prime);
  } catch {
    // not fatal
  }
}

async function playCue(cue: CueKey, lang: Lang) {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
  const entry = CUE_SPRITE[`${cue}:${lang}`];
  if (entry) await playSegment(entry);
}

/** Last 3 seconds before a 'work' phase starts (first exercise, or any exercise after a rest). */
export const playBeforeStartCue = (lang: Lang) => playCue('beforeStart', lang);
/** Once, when total elapsed time crosses 50% of the whole workout. */
export const playHalfwayCue = (lang: Lang) => playCue('halfway', lang);
/** Last 3 seconds before a plain per-exercise 'rest' phase starts. */
export const playBeforeRestCue = (lang: Lang) => playCue('beforeRest', lang);
/** Last 3 seconds before a 'cycleRest' phase starts (a full cycle just finished). */
export const playCycleCompleteCue = (lang: Lang) => playCue('cycleComplete', lang);
/** Once, when the entire schedule (all cycles) completes. */
export const playFinishedCue = (lang: Lang) => playCue('finished', lang);
