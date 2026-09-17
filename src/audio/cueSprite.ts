/**
 * Segment offsets/durations within assets/sounds/cues.wav — a single audio
 * "sprite" file combining all voice cues (plus one leading true-silence
 * segment used only for unlocking) into one continuous track. Generated
 * alongside cues.wav; regenerate both together if the source clips change.
 */
export type SpriteEntry = { offsetMs: number; durationMs: number };

export const CUE_SPRITE: Record<string, SpriteEntry> = {
  prime: { offsetMs: 0, durationMs: 250 },
  'beforeStart:en': { offsetMs: 500, durationMs: 4144 },
  'beforeStart:zh': { offsetMs: 4894, durationMs: 3224 },
  'halfway:en': { offsetMs: 8369, durationMs: 1679 },
  'halfway:zh': { offsetMs: 10298, durationMs: 1813 },
  'beforeRest:en': { offsetMs: 12361, durationMs: 4359 },
  'beforeRest:zh': { offsetMs: 16970, durationMs: 3334 },
  'finished:en': { offsetMs: 20555, durationMs: 1874 },
  'finished:zh': { offsetMs: 22679, durationMs: 1805 },
};
