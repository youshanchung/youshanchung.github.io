import { useEffect, useRef } from 'react';
import { useEngine } from '@/state/timerEngine';
import { useSettings } from '@/state/settingsStore';
import {
  configureAudio,
  playBeforeStartCue,
  playHalfwayCue,
  playBeforeRestCue,
  playFinishedCue,
} from './beeps';

/**
 * Owns every workout voice cue. Mounted exactly ONCE, from App.tsx — not from
 * RuntimeScreen.
 *
 * RuntimeScreen is shared by the Prepare/Work/Rest routes, and React
 * Navigation's native-stack keeps previously-visited screens mounted rather
 * than remounting them on a repeat visit (e.g. the 2nd, 3rd, ... 'Work'
 * phase all reuse the SAME 'Work' screen instance). A "have I already fired
 * this cue" ref living in RuntimeScreen would only ever reset on that
 * screen's very FIRST visit, then silently stay stale — and skip the cue —
 * on every later revisit of the same-named route. Living here instead, keyed
 * off `phaseIndex` itself rather than component mount lifecycle, sidesteps
 * that entirely: this hook's own mount lifecycle matches the whole app's.
 */
export function useWorkoutCues() {
  const schedule = useEngine((s) => s.schedule);
  const phaseIndex = useEngine((s) => s.phaseIndex);
  const remaining = useEngine((s) => s.remaining);
  const soundOn = useSettings((s) => s.soundOn);
  const lang = useSettings((s) => s.lang);

  useEffect(() => {
    configureAudio().catch(() => {});
  }, []);

  // Countdown voice cue: fires once per phaseIndex, when remaining is within
  // the last 3 seconds — "Three, two, one, go!" if the next phase is work,
  // "...rest!" if it's rest/cycleRest. Nothing fires for the very last work
  // interval (no next phase) — the "finished" cue covers that separately.
  //
  // Deliberately `sec <= 3`, not `sec === 3`: if the tab/screen was
  // backgrounded (locked phone, app switched away) for a few seconds, iOS can
  // throttle this effect enough that `remaining` jumps straight from, say,
  // 5.4 to 1.2 between renders — an exact-equality check would sail past 3
  // and never fire at all for that phase. The `countdownFiredFor` guard still
  // limits it to once per phase either way.
  const countdownFiredFor = useRef<number>(-1);
  useEffect(() => {
    if (!soundOn || schedule.length === 0 || phaseIndex >= schedule.length) return;
    const sec = Math.ceil(remaining);
    if (sec <= 3 && sec > 0 && countdownFiredFor.current !== phaseIndex) {
      countdownFiredFor.current = phaseIndex;
      const next = schedule[phaseIndex + 1];
      if (next?.kind === 'work') playBeforeStartCue(lang);
      else if (next?.kind === 'rest' || next?.kind === 'cycleRest') playBeforeRestCue(lang);
    }
  }, [remaining, soundOn, schedule, phaseIndex, lang]);

  // Halfway-there voice cue: fires once per 'work' phase (every exercise,
  // every cycle — not once for the whole workout), when remaining crosses
  // 50% of THAT exercise's own duration. Same `<=` + per-phaseIndex-guard
  // pattern as the countdown effect above, for the same reason: resilient to
  // a throttled/backgrounded tab skipping past the exact midpoint tick.
  const halfwayFiredFor = useRef<number>(-1);
  useEffect(() => {
    if (!soundOn || schedule.length === 0 || phaseIndex >= schedule.length) return;
    const phase = schedule[phaseIndex];
    if (phase.kind !== 'work') return;
    const midpoint = phase.durationSec / 2;
    if (remaining <= midpoint && halfwayFiredFor.current !== phaseIndex) {
      halfwayFiredFor.current = phaseIndex;
      playHalfwayCue(lang);
    }
  }, [remaining, soundOn, schedule, phaseIndex, lang]);

  // Workout-finished voice cue: fires once when the schedule runs out.
  // `hasFired` resets to false every time phaseIndex is back in valid range,
  // so re-running the same loaded workout (reset() + start() again) can fire
  // "finished" again too — this doesn't rely on `schedule` being a new array.
  const hasFiredFinished = useRef(false);
  useEffect(() => {
    if (schedule.length === 0) return;
    if (phaseIndex < schedule.length) {
      hasFiredFinished.current = false;
    } else if (!hasFiredFinished.current) {
      hasFiredFinished.current = true;
      if (soundOn) playFinishedCue(lang);
    }
  }, [phaseIndex, schedule, soundOn, lang]);
}
