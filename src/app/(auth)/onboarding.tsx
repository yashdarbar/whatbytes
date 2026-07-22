import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArrowRight } from '@/components/ui/icons';
import { TaskMark } from '@/features/auth/components';
import { useOnboardingStore } from '@/features/auth/store';
import { fontFamilies } from '@/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);

  function continueToLogin() {
    completeOnboarding();
    router.replace('/(auth)/login');
  }

  const footerWidth = Math.max(width * 1.8, 660);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.copyBlock}>
          <TaskMark />
          <Text accessibilityRole="header" style={styles.title}>
            Get things done.
          </Text>
          <Text style={styles.description}>Just a click away from planning your tasks.</Text>
          <View accessibilityLabel="Page 3 of 3" style={styles.dots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
          </View>
        </View>
      </View>

      <View
        pointerEvents="none"
        style={[styles.curvedFooter, { width: footerWidth, left: -(footerWidth - width) / 2 }]}
      />
      <Pressable
        accessibilityLabel="Continue to login"
        accessibilityRole="button"
        onPress={continueToLogin}
        style={({ pressed }) => [styles.nextButton, pressed ? styles.nextButtonPressed : null]}
      >
        <ArrowRight color="#FFFFFF" size={38} strokeWidth={2} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  content: { flex: 1, width: '100%', maxWidth: 460, alignSelf: 'center', paddingHorizontal: 34 },
  copyBlock: { marginTop: '28%', width: '100%', maxWidth: 310 },
  title: {
    marginTop: 18,
    color: '#24324A',
    fontFamily: fontFamilies.bold,
    fontSize: 25,
  },
  description: {
    marginTop: 11,
    maxWidth: 250,
    color: '#A0A6B2',
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  dots: { marginTop: 20, flexDirection: 'row', gap: 9 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E3E5EA' },
  activeDot: { backgroundColor: '#5C5CF4' },
  curvedFooter: {
    position: 'absolute',
    bottom: -390,
    height: 560,
    borderRadius: 999,
    backgroundColor: '#9290F2',
  },
  nextButton: {
    position: 'absolute',
    right: -32,
    bottom: -28,
    width: 138,
    height: 138,
    paddingRight: 30,
    paddingBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 69,
    backgroundColor: '#5C5CF4',
  },
  nextButtonPressed: { backgroundColor: '#4848D5' },
});
