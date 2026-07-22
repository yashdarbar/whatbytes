import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';

import type { AuthUser } from '../types';
import { firebaseAuth } from '@/lib/firebase';

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return { uid: user.uid, email: user.email ?? '' };
}

export async function getAuthSession(): Promise<AuthUser | null> {
  await firebaseAuth.authStateReady();
  return toAuthUser(firebaseAuth.currentUser);
}

export function subscribeToAuthSession(
  onSession: (user: AuthUser | null) => void,
  onError?: (error: Error) => void,
) {
  return onAuthStateChanged(firebaseAuth, (user) => onSession(toAuthUser(user)), onError);
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthUser> {
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email.trim().toLowerCase(),
    password,
  );
  return toAuthUser(credential.user) as AuthUser;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    email.trim().toLowerCase(),
    password,
  );
  return toAuthUser(credential.user) as AuthUser;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(firebaseAuth);
}

export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists for this email address.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Choose a stronger password with at least 8 characters.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email address or password is incorrect.';
    case 'auth/network-request-failed':
      return 'Unable to connect. Check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return 'Authentication failed. Please try again.';
  }
}
