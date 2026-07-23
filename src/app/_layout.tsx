import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthSessionBootstrap } from '@/features/auth/components/auth-session-bootstrap';
import { queryClient } from '@/lib/query';
import { useAppTheme, useThemeStore } from '@/theme';

// Keep the native splash visible until both persisted UI state and custom fonts are ready.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/**
 * Composes the application-wide providers and controls the handoff from the
 * native splash screen to Expo Router.
 */
export default function RootLayout() {
  const theme = useAppTheme();
  const themeHasHydrated = useThemeStore((state) => state.hasHydrated);
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    // A font error must not leave the user permanently stuck on the splash screen.
    if ((fontsLoaded || fontError) && themeHasHydrated) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontError, fontsLoaded, themeHasHydrated]);

  if ((!fontsLoaded && !fontError) || !themeHasHydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthSessionBootstrap />
          <StatusBar style={theme.isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
