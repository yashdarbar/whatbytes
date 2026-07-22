import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';

import type { ThemeMode } from './tokens';

type ThemeState = {
  hasHydrated: boolean;
  mode: ThemeMode;
  setHasHydrated: (hasHydrated: boolean) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      mode: 'dark',
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((state) => ({ mode: state.mode === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'task-management-theme',
      storage: createJSONStorage(() => zustandStorage),
      partialize: ({ mode }) => ({ mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          return;
        }

        useThemeStore.setState({ hasHydrated: true });
      },
    },
  ),
);
