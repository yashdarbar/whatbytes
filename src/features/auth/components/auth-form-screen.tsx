import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AuthFooter } from './auth-footer';
import { AuthScaffold } from './auth-scaffold';
import { FormField } from './form-field';
import { TaskMark } from './task-mark';
import { Button } from '@/components/ui';
import { useOnboardingStore } from '@/features/auth/store';
import { useSignIn, useSignUp } from '@/features/auth/hooks';
import { validateAuthForm } from '@/features/auth/validation';
import { fontFamilies } from '@/theme';

type AuthMode = 'login' | 'signup';

type AuthFormScreenProps = {
  mode: AuthMode;
};

const AUTH_ENTRANCE_DURATION = 400;
const AUTH_EXIT_DURATION = 240;
const AUTH_TRANSITION_OFFSET = 12;
const AUTH_TRANSITION_EASING = Easing.inOut(Easing.cubic);

export function AuthFormScreen({ mode }: AuthFormScreenProps) {
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState(() => validateAuthForm('valid@example.com', 'password'));
  const signIn = useSignIn();
  const signUp = useSignUp();
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const isLogin = mode === 'login';
  const activeMutation = isLogin ? signIn : signUp;
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateX = useRef(
    new Animated.Value(isLogin ? -AUTH_TRANSITION_OFFSET : AUTH_TRANSITION_OFFSET),
  ).current;
  const screenAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const reduceMotion = useRef(false);
  const transitioning = useRef(true);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    let isMounted = true;

    function finishTransition() {
      screenAnimation.current?.stop();
      screenOpacity.setValue(1);
      screenTranslateX.setValue(0);
      transitioning.current = false;
      if (isMounted) setIsTransitioning(false);
    }

    function handleReduceMotionChanged(isEnabled: boolean) {
      reduceMotion.current = isEnabled;
      if (isEnabled) finishTransition();
    }

    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (!isMounted) return;
      reduceMotion.current = isEnabled;

      if (isEnabled) {
        finishTransition();
        return;
      }

      screenAnimation.current = Animated.parallel([
        Animated.timing(screenOpacity, {
          duration: AUTH_ENTRANCE_DURATION,
          easing: AUTH_TRANSITION_EASING,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateX, {
          duration: AUTH_ENTRANCE_DURATION,
          easing: AUTH_TRANSITION_EASING,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]);
      screenAnimation.current.start(({ finished }) => {
        if (!finished || !isMounted) return;
        transitioning.current = false;
        setIsTransitioning(false);
      });
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      handleReduceMotionChanged,
    );

    return () => {
      isMounted = false;
      subscription.remove();
      screenAnimation.current?.stop();
    };
  }, [screenOpacity, screenTranslateX]);

  async function handleSubmit() {
    const nextErrors = validateAuthForm(email, password);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      await activeMutation.mutateAsync({ email, password });
      completeOnboarding();
      router.replace('/(app)');
    } catch {
      // TanStack Query exposes the mapped error below.
    }
  }

  function handleModeToggle() {
    if (transitioning.current) return;

    const destination = isLogin ? '/(auth)/sign-up' : '/(auth)/login';
    if (reduceMotion.current) {
      router.replace(destination);
      return;
    }

    transitioning.current = true;
    setIsTransitioning(true);
    screenAnimation.current?.stop();
    screenAnimation.current = Animated.parallel([
      Animated.timing(screenOpacity, {
        duration: AUTH_EXIT_DURATION,
        easing: AUTH_TRANSITION_EASING,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateX, {
        duration: AUTH_EXIT_DURATION,
        easing: AUTH_TRANSITION_EASING,
        toValue: isLogin ? -AUTH_TRANSITION_OFFSET : AUTH_TRANSITION_OFFSET,
        useNativeDriver: true,
      }),
    ]);
    screenAnimation.current.start(({ finished }) => {
      if (finished) router.replace(destination);
    });
  }

  return (
    <Animated.View
      needsOffscreenAlphaCompositing
      renderToHardwareTextureAndroid
      style={[
        styles.screen,
        { opacity: screenOpacity, transform: [{ translateX: screenTranslateX }] },
      ]}
    >
      <AuthScaffold
        footer={
          <AuthFooter
            action={isLogin ? 'Get started!' : 'Log in'}
            disabled={isTransitioning}
            onPress={handleModeToggle}
            prompt={isLogin ? "Don't have an account?" : 'Already have an account?'}
          />
        }
      >
        <TaskMark />
        <Text accessibilityRole="header" style={styles.title}>
          {isLogin ? 'Welcome back!' : "Let's get started!"}
        </Text>

        <View style={styles.form}>
          <FormField
            autoComplete="email"
            error={errors.email}
            keyboardType="email-address"
            label="Email address"
            onChangeText={(value) => {
              setEmail(value);
              activeMutation.reset();
              if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
            }}
            onSubmitEditing={() => passwordRef.current?.focus()}
            placeholder="you@example.com"
            returnKeyType="next"
            textContentType="emailAddress"
            value={email}
          />
          <View>
            <FormField
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              error={errors.password}
              label="Password"
              onChangeText={(value) => {
                setPassword(value);
                activeMutation.reset();
                if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
              }}
              onSubmitEditing={handleSubmit}
              placeholder="At least 8 characters"
              ref={passwordRef}
              returnKeyType="done"
              secureTextEntry
              textContentType={isLogin ? 'password' : 'newPassword'}
              value={password}
            />
          </View>

          {activeMutation.errorMessage ? (
            <Text accessibilityRole="alert" style={styles.authError}>
              {activeMutation.errorMessage}
            </Text>
          ) : null}

          <Button
            disabled={activeMutation.isPending}
            label={activeMutation.isPending ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'}
            labelStyle={styles.submitLabel}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: pressed ? '#4848D5' : '#5C5CF4' },
            ]}
            testID="auth-submit-button"
          />
        </View>
      </AuthScaffold>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  title: {
    marginTop: 8,
    color: '#24324A',
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  form: { marginTop: 34, gap: 18 },
  authError: {
    color: '#C53D4A',
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  submitButton: {
    width: '60%',
    alignSelf: 'center',
    marginTop: 7,
    borderRadius: 16,
    shadowColor: '#4646C8',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  submitLabel: { color: '#FFFFFF' },
});
