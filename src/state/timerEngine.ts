/**
 * Pure timer engine — no React, no UI.
 * Builds an ordered "schedule" of phases from a Workout, then ticks through them.
 *
 *   [prepare] -> for each cycle: (work, rest, work, rest, ...) -> cycleRest -> ...
 *   The final rest of the final cycle is omitted (workout ends on a work phase).
 */

import { create } from 'zustand';
import type { Workout, Exercise } from './workoutStore';

export type PhaseKind = 'prepare' | 'work' | 'rest' | 'cycleRest' | 'done';

export type ScheduledPhase = {
  kind: PhaseKind;
  durationSec: number;
  exerciseIndex?: number;
  cycleNumber?: number;
  label?: string;
};

export function buildSchedule(w: Workout): ScheduledPhase[] {
  const out: ScheduledPhase[] = [];
  if (w.prepareSec > 0) {
    out.push({ kind: 'prepare', durationSec: w.prepareSec, label: 'PREPARE' });
  }
  for (let c = 1; c <= w.cycles; c++) {
    w.exercises.forEach((ex: Exercise, idx: number) => {
      out.push({
        kind: 'work',
        durationSec: ex.workSec,
        exerciseIndex: idx,
        cycleNumber: c,
        label: ex.name,
      });
      const isLastEverPhase = c === w.cycles && idx === w.exercises.length - 1;
      if (!isLastEverPhase && ex.restSec > 0) {
        out.push({
          kind: 'rest',
          durationSec: ex.restSec,
          exerciseIndex: idx,
          cycleNumber: c,
          label: ex.name,
        });
      }
    });
    if (c < w.cycles && w.cycleRestSec > 0) {
      out.push({ kind: 'cycleRest', durationSec: w.cycleRestSec, cycleNumber: c });
    }
  }
  return out;
}

export function totalSeconds(schedule: ScheduledPhase[]): number {
  return schedule.reduce((sum, p) => sum + p.durationSec, 0);
}

function sumFrom(schedule: ScheduledPhase[], fromIdx: number): number {
  let total = 0;
  for (let i = fromIdx; i < schedule.length; i++) total += schedule[i].durationSec;
  return total;
}

// -----------------------------------------------------------------------------
// Runtime store: ticks with sub-second resolution using a wall-clock anchor
// so the timer doesn't drift even if the JS runtime hiccups.
// -----------------------------------------------------------------------------

type EngineState = {
  schedule: ScheduledPhase[];
  phaseIndex: number;
  remaining: number;       // seconds left in current phase
  totalRemaining: number;  // seconds left in the entire workout
  running: boolean;
  anchorMs: number;        // wall-clock time when current countdown started
  anchorRemaining: number; // remaining value at that anchor (post-pause aware)
  intervalId: ReturnType<typeof setInterval> | null;

  load: (w: Workout) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  reset: () => void;
  _tick: () => void;
};

const TICK_MS = 200;

export const useEngine = create<EngineState>((set, get) => ({
  schedule: [],
  phaseIndex: 0,
  remaining: 0,
  totalRemaining: 0,
  running: false,
  anchorMs: 0,
  anchorRemaining: 0,
  intervalId: null,

  load(w) {
    const schedule = buildSchedule(w);
    set({
      schedule,
      phaseIndex: 0,
      remaining: schedule[0]?.durationSec ?? 0,
      totalRemaining: totalSeconds(schedule),
      running: false,
      anchorMs: 0,
      anchorRemaining: 0,
    });
  },

  start() {
    const { intervalId, schedule } = get();
    if (intervalId) clearInterval(intervalId);
    if (schedule.length === 0) return;
    const id = setInterval(() => get()._tick(), TICK_MS);
    set({
      running: true,
      anchorMs: Date.now(),
      anchorRemaining: get().remaining,
      intervalId: id,
    });
  },

  pause() {
    const { intervalId, anchorMs, anchorRemaining } = get();
    if (intervalId) clearInterval(intervalId);
    const elapsed = (Date.now() - anchorMs) / 1000;
    const remaining = Math.max(0, anchorRemaining - elapsed);
    set({ running: false, intervalId: null, remaining });
  },

  resume() {
    const { intervalId, remaining, schedule } = get();
    if (intervalId) clearInterval(intervalId);
    if (schedule.length === 0) return;
    const id = setInterval(() => get()._tick(), TICK_MS);
    set({
      running: true,
      anchorMs: Date.now(),
      anchorRemaining: remaining,
      intervalId: id,
    });
  },

  skip() {
    const { phaseIndex, schedule } = get();
    const next = phaseIndex + 1;
    if (next >= schedule.length) {
      get().reset();
      return;
    }
    const dur = schedule[next].durationSec;
    set({
      phaseIndex: next,
      remaining: dur,
      anchorMs: Date.now(),
      anchorRemaining: dur,
      totalRemaining: sumFrom(schedule, next),
    });
  },

  reset() {
    const { intervalId, schedule } = get();
    if (intervalId) clearInterval(intervalId);
    set({
      phaseIndex: 0,
      remaining: schedule[0]?.durationSec ?? 0,
      totalRemaining: totalSeconds(schedule),
      running: false,
      intervalId: null,
      anchorMs: 0,
      anchorRemaining: 0,
    });
  },

  _tick() {
    const { running, anchorMs, anchorRemaining, schedule, phaseIndex } = get();
    if (!running) return;

    const elapsed = (Date.now() - anchorMs) / 1000;
    const remaining = anchorRemaining - elapsed;

    if (remaining > 0) {
      const future = sumFrom(schedule, phaseIndex + 1);
      set({ remaining, totalRemaining: remaining + future });
      return;
    }

    // Phase ended → advance
    const nextIndex = phaseIndex + 1;
    if (nextIndex >= schedule.length) {
      const { intervalId } = get();
      if (intervalId) clearInterval(intervalId);
      set({
        phaseIndex: nextIndex,
        remaining: 0,
        totalRemaining: 0,
        running: false,
        intervalId: null,
      });
      return;
    }
    const nextDur = schedule[nextIndex].durationSec;
    set({
      phaseIndex: nextIndex,
      remaining: nextDur,
      anchorMs: Date.now(),
      anchorRemaining: nextDur,
      totalRemaining: sumFrom(schedule, nextIndex),
    });
  },
}));
