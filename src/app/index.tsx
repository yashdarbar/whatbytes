import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuthSession, useOnboardingStore } from '@/features/auth';

export default function EntryScreen() {
  const hasHydrated = useOnboardingStore((state) => state.hasHydrated);
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const { isAuthenticated, isAuthReady } = useAuthSession();

  if (!hasHydrated || !isAuthReady) {
    return (
      <View accessibilityLabel="Loading app" style={styles.loading}>
        <ActivityIndicator color="#5C5CF4" size="large" />
      </View>
    );
  }

  if (isAuthenticated) return <Redirect href="/(app)" />;
  if (hasSeenOnboarding) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(auth)/onboarding" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
