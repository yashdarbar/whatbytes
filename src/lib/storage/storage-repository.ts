import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageRepository<T> {
  get(): Promise<T | null>;
  set(value: T): Promise<void>;
  remove(): Promise<void>;
}

/**
 * Small typed wrapper around AsyncStorage for feature state that does not
 * belong in Firebase or TanStack Query.
 */
export class AsyncStorageRepository<T> implements StorageRepository<T> {
  constructor(private readonly key: string) {}

  async get(): Promise<T | null> {
    const value = await AsyncStorage.getItem(this.key);
    return value === null ? null : (JSON.parse(value) as T);
  }

  async set(value: T): Promise<void> {
    await AsyncStorage.setItem(this.key, JSON.stringify(value));
  }

  async remove(): Promise<void> {
    await AsyncStorage.removeItem(this.key);
  }
}
