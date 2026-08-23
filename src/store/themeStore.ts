import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Keeps <html class="dark"> in sync with the store — Tailwind's `dark:`
// variants key off that class (darkMode: 'class' in tailwind.config.js).
const applyThemeClass = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',

      toggleTheme: () => {
        const next: Theme = get().theme === 'light' ? 'dark' : 'light';
        applyThemeClass(next);
        set({ theme: next });
      },

      setTheme: (theme) => {
        applyThemeClass(theme);
        set({ theme });
      },
    }),
    {
      name: 'sprintdesk_theme',
      onRehydrateStorage: () => (state) => {
        // Apply the persisted theme to <html> as soon as it's loaded from
        // localStorage, so there's no flash of the wrong theme on reload.
        if (state) applyThemeClass(state.theme);
      },
    },
  ),
);
