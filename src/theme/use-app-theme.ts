import { getTheme } from './tokens';
import { useThemeStore } from './theme-store';

export function useAppTheme() {
  return getTheme(useThemeStore((state) => state.mode));
}
