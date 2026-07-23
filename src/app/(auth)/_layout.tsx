import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAuthSession } from '@/features/auth';

/** Keeps authenticated users out of the login and registration route group. */
export default function AuthLayout() {
  const { isAuthenticated, isAuthReady } = useAuthSession();

  if (isAuthReady && isAuthenticated) return <Redirect href="/(app)" />;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
        {/* The form component owns this transition to avoid a native navigation flash. */}
        <Stack.Screen name="login" options={{ animation: 'none' }} />
        <Stack.Screen name="sign-up" options={{ animation: 'none' }} />
      </Stack>
    </>
  );
}
