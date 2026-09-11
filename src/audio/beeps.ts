/**
 * Audio + haptic cue manager.
 *
 * Haptics (expo-haptics) give tactile feedback on native iOS/Android, but are
 * a silent no-op on web — there's no vibration API exposed to browsers. So we
 * also play short synthesized beep tones (assets/sounds/*.wav) via expo-av,
 * which works on native *and* web (backed by an HTMLAudioElement there).
 */

import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Haptics from 'expo-haptics';

let audioModeConfigured = false;
let tickSound: Audio.Sound | null = null;
let phaseSound: Audio.Sound | null = null;
let loadingSounds: Promise<void> | null = null;

async function ensureSoundsLoaded() {
  if (tickSound && phaseSound) return;
  if (!loadingSounds) {
    loadingSounds = (async () => {
      try {
        const [{ sound: t }, { sound: p }] = await Promise.all([
          Audio.Sound.createAsync(require('../../assets/sounds/tick.wav')),
          Audio.Sound.createAsync(require('../../assets/sounds/phasechange.wav')),
        ]);
        tickSound = t;
        phaseSound = p;
      } catch {
        // Sound files failed to load (e.g. unsupported platform) — haptics-only fallback remains.
      }
    })();
  }
  await loadingSounds;
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
 * Play each cue's sound once, silently, right now. Browsers only allow audio
 * playback that's triggered by (or very close to) a real user tap — calling
 * this from the "Start" button's onPress unlocks both sounds for the rest of
 * the workout, before the timer starts calling them on its own from timers.
 */
export async function primeAudio() {
  try {
    await ensureSoundsLoaded();
    for (const s of [tickSound, phaseSound]) {
      if (!s) continue;
      await s.setVolumeAsync(0);
      await s.replayAsync();
      await s.stopAsync();
      await s.setVolumeAsync(1);
    }
  } catch {
    // not fatal — worst case, sounds stay silent on a strict browser
  }
}

/** Short tick on the final 3 seconds of a phase. */
export async function tickCue() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
  try {
    await tickSound?.replayAsync();
  } catch {}
}

/** Distinct cue when a phase changes (work→rest, etc.). */
export async function phaseChangeCue() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
  try {
    await phaseSound?.replayAsync();
  } catch {}
}
