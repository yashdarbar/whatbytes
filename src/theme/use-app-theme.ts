import { getTheme } from './tokens';
import { useThemeStore } from './theme-store';

/** Resolves the persisted mode into the complete set of semantic theme tokens. */
export function useAppTheme() {
  return getTheme(useThemeStore((state) => state.mode));
}
