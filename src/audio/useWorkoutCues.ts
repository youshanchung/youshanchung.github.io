import { useEffect, useRef } from 'react';
import { useEngine } from '@/state/timerEngine';
import { useSettings } from '@/state/settingsStore';
import {
  configureAudio,
  playBeforeStartCue,
  playHalfwayCue,
  playBeforeRestCue,
  playCycleCompleteCue,
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

  const countdownFiredFor = useRef<number>(-1);
  const halfwayFiredFor = useRef<number>(-1);

  // The two refs above are keyed on phaseIndex alone, and phaseIndex resets
  // to 0 every time a workout is (re)started — but the refs themselves live
  // for the app's entire lifetime, so a stale value from a PREVIOUS run can
  // wrongly suppress a cue in the NEW one. E.g.: quit during phase 1, before
  // phase 1's own countdown fired -> countdownFiredFor is still 0 (from
  // phase 0's prepare countdown) -> restart -> phase 0 comes around again ->
  // guard sees "already fired for phase 0" and wrongly skips it.
  //
  // First attempt here watched "phaseIndex went backward", but that misses
  // the case actually reported: quitting DURING phase 0 itself (before it
  // ever advances past 0) leaves phaseIndex sitting at 0 the whole time —
  // it never goes backward because it never went anywhere. The reliable
  // signal instead is the `schedule` array's identity: load() (called every
  // time "Start" is tapped) always runs buildSchedule() and produces a
  // brand-new array, even if the numbers are identical to last time —
  // unlike phaseIndex, this changes on every single restart, regardless of
  // how far the previous run got.
  //
  // Declared (and thus run, per React's in-declaration-order effect
  // execution) BEFORE the countdown/halfway effects below, not after: this
  // and the countdown effect both depend on `schedule`, so both re-run on
  // the same render when a new workout loads. With this effect declared
  // AFTER the countdown effect (an earlier version of this fix), a workout
  // whose prepareSec is short enough to satisfy the countdown's "<=3
  // seconds left" on the very first tick would fire the countdown, THEN
  // this effect would immediately wipe that same-render fire's flag back to
  // -1, causing a duplicate fire on the next tick. Running first means the
  // reset (if any) is already done before the countdown effect below even
  // checks its guard.
  const prevScheduleForResetRef = useRef(schedule);
  useEffect(() => {
    if (schedule !== prevScheduleForResetRef.current) {
      countdownFiredFor.current = -1;
      halfwayFiredFor.current = -1;
      prevScheduleForResetRef.current = schedule;
    }
  }, [schedule]);

  // Countdown voice cue: fires once per phaseIndex, when remaining is within
  // the last 3 seconds — "Three, two, one, go!" if the next phase is work,
  // "...rest!" for a plain per-exercise rest, "...cycle complete!" if a full
  // cycle just finished. Nothing fires for the very last work interval (no
  // next phase) — the "finished" cue covers that separately.
  //
  // Deliberately `sec <= 3`, not `sec === 3`: if the tab/screen was
  // backgrounded (locked phone, app switched away) for a few seconds, iOS can
  // throttle this effect enough that `remaining` jumps straight from, say,
  // 5.4 to 1.2 between renders — an exact-equality check would sail past 3
  // and never fire at all for that phase. The `countdownFiredFor` guard still
  // limits it to once per phase either way.
  useEffect(() => {
    if (!soundOn || schedule.length === 0 || phaseIndex >= schedule.length) return;
    const sec = Math.ceil(remaining);
    if (sec <= 3 && sec > 0 && countdownFiredFor.current !== phaseIndex) {
      countdownFiredFor.current = phaseIndex;
      const next = schedule[phaseIndex + 1];
      if (next?.kind === 'work') playBeforeStartCue(lang);
      else if (next?.kind === 'cycleRest') playCycleCompleteCue(lang);
      else if (next?.kind === 'rest') playBeforeRestCue(lang);
    }
  }, [remaining, soundOn, schedule, phaseIndex, lang]);

  // Halfway-there voice cue: fires once per 'work' phase (every exercise,
  // every cycle — not once for the whole workout), when remaining crosses
  // 50% of THAT exercise's own duration. Same `<=` + per-phaseIndex-guard
  // pattern as the countdown effect above, for the same reason: resilient to
  // a throttled/backgrounded tab skipping past the exact midpoint tick.
  //
  // Skipped entirely for short phases (< MIN_DURATION_FOR_HALFWAY_SEC): the
  // countdown-to-next-phase cue always fires at "3 seconds left", so for a
  // short enough phase its trigger point (duration-3) lands close to or
  // before halfway's own (duration/2) — meaning halfway's ~1.8s clip can
  // still be playing when the countdown needs to start. playSegment() force-
  // interrupts (pause+seek+play) whatever's currently playing to start a new
  // cue, and that's exactly the kind of operation that's proven unreliable
  // on real iOS Safari throughout this project — confirmed here too: cues
  // colliding like this were reported as going missing (not just cut short),
  // and lengthening the work phases so they no longer collided resolved it.
  // 10s gives halfway's clip (max ~1.8s, rounded up to 2s) a full 3s of
  // margin before the countdown's own trigger point: duration/2 + 2 <=
  // duration-3 rearranges to duration >= 10.
  const MIN_DURATION_FOR_HALFWAY_SEC = 10;
  useEffect(() => {
    if (!soundOn || schedule.length === 0 || phaseIndex >= schedule.length) return;
    const phase = schedule[phaseIndex];
    if (phase.kind !== 'work') return;
    if (phase.durationSec < MIN_DURATION_FOR_HALFWAY_SEC) return;
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
