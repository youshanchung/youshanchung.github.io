import { create } from 'zustand';
import type { Lang } from '@/i18n/strings';

type SettingsState = {
  lang: Lang;
  soundOn: boolean;
  pauseOnBackground: boolean;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  toggleSound: () => void;
  togglePauseOnBackground: () => void;
};

export const useSettings = create<SettingsState>((set) => ({
  lang: 'zh',
  soundOn: true,
  pauseOnBackground: false,
  setLang: (lang) => set({ lang }),
  toggleLang: () => set((s) => ({ lang: s.lang === 'zh' ? 'en' : 'zh' })),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
  togglePauseOnBackground: () => set((s) => ({ pauseOnBackground: !s.pauseOnBackground })),
}));
