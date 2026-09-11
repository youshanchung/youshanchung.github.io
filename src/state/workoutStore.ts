import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A single exercise. Each can have its OWN work + rest duration.
 * (Per-exercise flexibility: longer rest for squats than lunges, etc.)
 */
export type Exercise = {
  id: string;
  name: string;
  workSec: number;
  restSec: number;
};

export type Workout = {
  exercises: Exercise[];
  cycles: number;          // how many times to repeat the whole exercise list
  cycleRestSec: number;    // long rest between full cycles
  prepareSec: number;      // initial "GET READY" countdown
};

const STORAGE_KEY = 'hiit.lastWorkout.v1';

const defaultWorkout: Workout = {
  exercises: [
    { id: 'e1', name: 'SQUAT', workSec: 40, restSec: 20 },
    { id: 'e2', name: 'LUNGE', workSec: 40, restSec: 20 },
  ],
  cycles: 2,
  cycleRestSec: 50,
  prepareSec: 10,
};

type WorkoutState = {
  workout: Workout;
  setWorkout: (w: Workout) => void;
  setExercises: (ex: Exercise[]) => void;
  setCycles: (n: number) => void;
  setCycleRest: (n: number) => void;
  setPrepare: (n: number) => void;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<boolean>;
};

export const useWorkout = create<WorkoutState>((set, get) => ({
  workout: defaultWorkout,
  setWorkout: (workout) => set({ workout }),
  setExercises: (exercises) => set((s) => ({ workout: { ...s.workout, exercises } })),
  setCycles: (cycles) => set((s) => ({ workout: { ...s.workout, cycles } })),
  setCycleRest: (cycleRestSec) => set((s) => ({ workout: { ...s.workout, cycleRestSec } })),
  setPrepare: (prepareSec) => set((s) => ({ workout: { ...s.workout, prepareSec } })),

  async saveToStorage() {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().workout));
  },

  async loadFromStorage() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    try {
      const w = JSON.parse(raw) as Workout;
      set({ workout: w });
      return true;
    } catch {
      return false;
    }
  },
}));
