import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  getAuthErrorMessage,
  getAuthSession,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  subscribeToAuthSession,
} from '../queries';
import type { AuthUser } from '../types';

export const authQueryKeys = {
  all: ['auth'] as const,
  session: ['auth', 'session'] as const,
};

/** Exposes the cached Firebase session in a routing-friendly shape. */
export function useAuthSession() {
  const query = useQuery({
    queryKey: authQueryKeys.session,
    queryFn: getAuthSession,
    staleTime: Infinity,
  });

  return {
    ...query,
    user: query.data ?? null,
    isAuthenticated: query.data != null,
    isAuthReady: !query.isPending,
  };
}

/**
 * Bridges Firebase's auth observer into TanStack Query, making the query cache
 * the single source of backend session state for the component tree.
 */
export function useAuthSessionSync() {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribeToAuthSession(
        (user) => queryClient.setQueryData<AuthUser | null>(authQueryKeys.session, user),
        () => void queryClient.invalidateQueries({ queryKey: authQueryKeys.session }),
      ),
    [queryClient],
  );
}

function useAuthMutation(
  mutationFn: (credentials: { email: string; password: string }) => Promise<AuthUser>,
) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn,
    onSuccess: (user) => queryClient.setQueryData(authQueryKeys.session, user),
  });

  return {
    ...mutation,
    errorMessage: mutation.error ? getAuthErrorMessage(mutation.error) : null,
  };
}

/** Signs in with email/password and updates the cached session on success. */
export function useSignIn() {
  return useAuthMutation(({ email, password }) => signInWithEmail(email, password));
}

/** Registers a user and immediately stores the resulting authenticated session. */
export function useSignUp() {
  return useAuthMutation(({ email, password }) => signUpWithEmail(email, password));
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.setQueryData(authQueryKeys.session, null);
      // Prevent one account's tasks from briefly appearing after another account signs in.
      queryClient.removeQueries({ queryKey: ['tasks'] });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? getAuthErrorMessage(mutation.error) : null,
  };
}
