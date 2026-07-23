import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuthSession } from '@/features/auth';
import { useTaskRealtimeSync } from '@/features/tasks';

/**
 * Protects every route in the authenticated group and starts the task listener
 * only for the active Firebase user.
 */
export default function AppLayout() {
  const { user, isAuthenticated, isAuthReady } = useAuthSession();
  useTaskRealtimeSync(user?.uid);

  if (!isAuthReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#5C5CF4" size="large" />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
