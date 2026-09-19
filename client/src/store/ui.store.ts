import { create } from 'zustand';

/**
 * UI-only state for GeoMarket.
 *
 * IMPORTANT: Authenticated user data lives exclusively in TanStack Query
 * (queryKey: ['auth', 'me']). This store holds only transient UI state
 * that does NOT duplicate server state.
 */
interface UiStore {
  /** Mobile navigation drawer open/closed */
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
}));
