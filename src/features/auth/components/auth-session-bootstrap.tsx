import { useAuthSessionSync } from '../hooks';

export function AuthSessionBootstrap() {
  useAuthSessionSync();

  return null;
}
