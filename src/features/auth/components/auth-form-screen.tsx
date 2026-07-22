import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

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

  return (
    <AuthScaffold
      footer={
        <AuthFooter
          action={isLogin ? 'Get started!' : 'Log in'}
          onPress={() => router.replace(isLogin ? '/(auth)/sign-up' : '/(auth)/login')}
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
            { backgroundColor: pressed ? '#1D4ED8' : '#2563EB' },
          ]}
          testID="auth-submit-button"
        />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
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
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  submitLabel: { color: '#FFFFFF' },
});
