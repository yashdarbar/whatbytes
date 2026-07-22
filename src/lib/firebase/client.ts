import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

import { getFirebaseConfig } from './config';

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());

function initializeFirebaseAuth(): Auth {
  try {
    return initializeAuth(firebaseApp, {
      persistence:
        Platform.OS === 'web' ? browserLocalPersistence : getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export const firebaseAuth = initializeFirebaseAuth();
export const firestore = getFirestore(firebaseApp);
