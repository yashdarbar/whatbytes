export const fontFamilies = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

const shared = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 20, pill: 999 },
  typography: {
    display: { fontFamily: fontFamilies.bold, fontSize: 32, lineHeight: 40 },
    title: { fontFamily: fontFamilies.semibold, fontSize: 22, lineHeight: 28 },
    body: { fontFamily: fontFamilies.regular, fontSize: 16, lineHeight: 24 },
    label: { fontFamily: fontFamilies.semibold, fontSize: 14, lineHeight: 20 },
  },
};

export const lightTheme = {
  ...shared,
  isDark: false,
  colors: {
    background: '#FFFFFF',
    dashboardBackground: '#F7F8FC',
    surface: '#FFFFFF',
    text: '#171A21',
    textMuted: '#616979',
    primary: '#4F63E9',
    primaryPressed: '#3D4FC5',
    onPrimary: '#FFFFFF',
    header: '#7774ED',
    headerMuted: '#E4E3FF',
    navigation: '#FFFFFF',
    border: '#E2E5EC',
    inputBackground: '#F4F6FA',
    placeholder: '#9BA3B2',
    success: '#25855A',
    danger: '#C53D4A',
    priorityLow: '#6BC7A2',
    priorityMedium: '#8B83EE',
    priorityHigh: '#F39A55',
  },
  shadow: {
    shadowColor: '#10131A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
} as const;

export const darkTheme = {
  ...shared,
  isDark: true,
  colors: {
    background: '#10131A',
    dashboardBackground: '#10131A',
    surface: '#191D27',
    text: '#F6F7FA',
    textMuted: '#A8B0BF',
    primary: '#8492FF',
    primaryPressed: '#6979F4',
    onPrimary: '#10131A',
    header: '#5553B9',
    headerMuted: '#D7D6FF',
    navigation: '#191D27',
    border: '#2A3040',
    inputBackground: '#222735',
    placeholder: '#788195',
    success: '#55C38A',
    danger: '#F27682',
    priorityLow: '#55C38A',
    priorityMedium: '#9B95FF',
    priorityHigh: '#F5A365',
  },
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 4,
  },
} as const;

export type AppTheme = typeof lightTheme | typeof darkTheme;
export type ThemeMode = 'dark' | 'light';

export function getTheme(mode: ThemeMode): AppTheme {
  return mode === 'dark' ? darkTheme : lightTheme;
}
