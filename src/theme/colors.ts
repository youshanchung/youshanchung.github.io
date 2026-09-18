/**
 * Theme tokens extracted from the 4 reference screenshots.
 * Change a color here → it updates everywhere in the app.
 */

export type PhaseTheme = {
  gradient: [string, string]; // background top -> bottom
  ringActive: string;          // bright ring segments
  ringTrack: string;           // dim ring segments
  cardBg: string;              // translucent stat card background
  text: string;
  textMuted: string;
};

export const Phase = {
  /** Yellow "準備" (get ready) screen */
  prepare: {
    gradient: ['#FFC861', '#F39C2C'],
    ringActive: '#FFFFFF',
    ringTrack: 'rgba(255,255,255,0.35)',
    cardBg: 'rgba(255,255,255,0.22)',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.75)',
  },
  /** Green "運動" (work) screen */
  work: {
    gradient: ['#6FE7B0', '#3FCB9A'],
    ringActive: '#FFFFFF',
    ringTrack: 'rgba(255,255,255,0.35)',
    cardBg: 'rgba(255,255,255,0.22)',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.85)',
  },
  /** Red/pink "休息" (rest) screen */
  rest: {
    gradient: ['#FF6B8A', '#F0455D'],
    ringActive: '#FFFFFF',
    ringTrack: 'rgba(255,255,255,0.35)',
    cardBg: 'rgba(255,255,255,0.22)',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.85)',
  },
  /** Yellow "回合結束" (cycle complete) screen — deliberately a more golden
   *  yellow than `prepare`'s orange-leaning one, so the two aren't
   *  mistakable for each other despite both being "yellow". */
  cycleRest: {
    gradient: ['#FFDD57', '#F2B705'],
    ringActive: '#FFFFFF',
    ringTrack: 'rgba(255,255,255,0.35)',
    cardBg: 'rgba(255,255,255,0.22)',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.85)',
  },
} as const satisfies Record<string, PhaseTheme>;

/** Setup / config screen palette (light background, colored accent cards) */
export const Setup = {
  headerGradient: ['#6FE7B0', '#3DD0A6'] as [string, string],
  background: '#F5F6F8',
  cardBg: '#FFFFFF',
  text: '#1F2430',
  textMuted: '#8A93A4',
  accentWork: '#3FCB9A',
  accentRest: '#F0455D',
  accentCycles: '#6B7BFF',
  accentReset: '#F2B53A',
  accentSound: '#8A93A4',
  primaryButton: '#6FE7B0',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  card: 18,
  button: 28,
  pill: 999,
};

export const Font = {
  display: 'System',
  body: 'System',
};
