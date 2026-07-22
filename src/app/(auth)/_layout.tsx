import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAuthSession } from '@/features/auth';

export default function AuthLayout() {
  const { isAuthenticated, isAuthReady } = useAuthSession();

  if (isAuthReady && isAuthenticated) return <Redirect href="/(app)" />;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
        <Stack.Screen name="login" options={{ animation: 'none' }} />
        <Stack.Screen name="sign-up" options={{ animation: 'none' }} />
      </Stack>
    </>
  );
}
