/**
 * Audio + haptic cue manager.
 *
 * MVP ships WITHOUT bundled sound files (keeps the scaffold light). We use
 * expo-haptics for tactile cues, which on iPhone is very noticeable mid-workout.
 *
 * To add real audio later: drop `beep.mp3` and `ding.mp3` into
 * `assets/sounds/`, then uncomment the Audio.Sound code below.
 */

import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Haptics from 'expo-haptics';

let configured = false;

export async function configureAudio() {
  if (configured) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    });
    configured = true;
  } catch {
    // not fatal
  }
}

/** Short tick on the final 3 seconds of a phase. */
export async function tickCue() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

/** Distinct cue when a phase changes (work→rest, etc.). */
export async function phaseChangeCue() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}
