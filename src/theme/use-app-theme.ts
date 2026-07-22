import { useColorScheme } from 'react-native';

import { getTheme } from './tokens';

export function useAppTheme() {
  return getTheme(useColorScheme());
}
