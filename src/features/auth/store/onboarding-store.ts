import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';

type OnboardingState = {
  hasHydrated: boolean;
  hasSeenOnboarding: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  completeOnboarding: () => void;
};

/** Persists only whether onboarding was completed; hydration remains runtime state. */
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      hasSeenOnboarding: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
    }),
    {
      name: 'task-management-auth',
      storage: createJSONStorage(() => zustandStorage),
      partialize: ({ hasSeenOnboarding }) => ({ hasSeenOnboarding }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
