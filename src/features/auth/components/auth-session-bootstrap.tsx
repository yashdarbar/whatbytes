import { useAuthSessionSync } from '../hooks';

/** Mounts the global Firebase auth observer without rendering visible UI. */
export function AuthSessionBootstrap() {
  useAuthSessionSync();

  return null;
}
