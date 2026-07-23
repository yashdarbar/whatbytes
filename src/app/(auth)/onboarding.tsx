import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArrowRight } from '@/components/ui/icons';
import { TaskMark } from '@/features/auth/components';
import { useOnboardingStore } from '@/features/auth/store';
import { fontFamilies } from '@/theme';

const onboardingMessages = [
  'Just a click away from planning your tasks.',
  'Organize tasks by priority and stay ahead of every due date.',
  'Track your progress and turn plans into completed goals.',
];
const MESSAGE_DISPLAY_DURATION = 3500;
const MESSAGE_FADE_OUT_DURATION = 220;
const MESSAGE_FADE_IN_DURATION = 420;
const MESSAGE_TRANSITION_EASING = Easing.inOut(Easing.cubic);

/**
 * First-run introduction with rotating supporting copy. Completion is persisted
 * so returning signed-out users can proceed directly to login.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const { fontScale, height, width } = useWindowDimensions();
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const messageAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const reduceMotion = useRef(false);
  const isConstrainedLayout = height < 700 || fontScale > 1.15;
  const nextButtonDiameter = Math.min(width * 0.95, height * 0.62);
  const nextIconSize = Math.min(Math.max(nextButtonDiameter * 0.22, 38), 48);
  const constrainedBottomPadding = Math.max(96, nextButtonDiameter * 0.34);

  useEffect(() => {
    let isMounted = true;

    function finishAnimation() {
      messageAnimation.current?.stop();
      messageOpacity.setValue(1);
    }

    function handleReduceMotionChanged(isEnabled: boolean) {
      reduceMotion.current = isEnabled;
      if (isEnabled) finishAnimation();
    }

    function showNextMessage() {
      if (reduceMotion.current) {
        setActiveMessageIndex((current) => (current + 1) % onboardingMessages.length);
        return;
      }

      messageAnimation.current?.stop();
      messageAnimation.current = Animated.timing(messageOpacity, {
        duration: MESSAGE_FADE_OUT_DURATION,
        easing: MESSAGE_TRANSITION_EASING,
        toValue: 0,
        useNativeDriver: true,
      });
      messageAnimation.current.start(({ finished }) => {
        if (!finished || !isMounted) return;

        setActiveMessageIndex((current) => (current + 1) % onboardingMessages.length);
        messageOpacity.setValue(0);
        messageAnimation.current = Animated.timing(messageOpacity, {
          duration: MESSAGE_FADE_IN_DURATION,
          easing: MESSAGE_TRANSITION_EASING,
          toValue: 1,
          useNativeDriver: true,
        });
        messageAnimation.current.start();
      });
    }

    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (isMounted) handleReduceMotionChanged(isEnabled);
    });

    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      handleReduceMotionChanged,
    );
    const messageInterval = setInterval(showNextMessage, MESSAGE_DISPLAY_DURATION);

    return () => {
      isMounted = false;
      clearInterval(messageInterval);
      reduceMotionSubscription.remove();
      messageAnimation.current?.stop();
    };
  }, [messageOpacity]);

  function continueToLogin() {
    completeOnboarding();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={isConstrainedLayout}
        contentContainerStyle={[
          styles.content,
          isConstrainedLayout && { paddingBottom: constrainedBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.copyBlock}>
          <TaskMark />
          <Text accessibilityRole="header" style={styles.title}>
            Get things done.
          </Text>
          <View style={styles.descriptionContainer}>
            <Animated.Text style={[styles.description, { opacity: messageOpacity }]}>
              {onboardingMessages[activeMessageIndex]}
            </Animated.Text>
          </View>
          <View
            accessibilityLabel={`Page ${activeMessageIndex + 1} of ${onboardingMessages.length}`}
            style={styles.dots}
          >
            {onboardingMessages.map((message, index) => (
              <View
                key={message}
                style={[styles.dot, index === activeMessageIndex ? styles.activeDot : null]}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <Pressable
        accessibilityLabel="Continue to login"
        accessibilityRole="button"
        onPress={continueToLogin}
        style={({ pressed }) => [
          styles.nextButton,
          {
            right: -nextButtonDiameter * 0.42,
            bottom: -nextButtonDiameter * 0.5,
            width: nextButtonDiameter,
            height: nextButtonDiameter,
            paddingRight: nextButtonDiameter * 0.16,
            paddingBottom: nextButtonDiameter * 0.4,
            borderRadius: nextButtonDiameter / 2,
          },
          pressed ? styles.nextButtonPressed : null,
        ]}
      >
        <ArrowRight color="#FFFFFF" size={nextIconSize} strokeWidth={2} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  copyBlock: { width: '100%', maxWidth: 310 },
  title: {
    marginTop: 18,
    color: '#24324A',
    fontFamily: fontFamilies.bold,
    fontSize: 25,
  },
  description: {
    maxWidth: 250,
    color: '#A0A6B2',
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  descriptionContainer: { minHeight: 72, marginTop: 11 },
  dots: { marginTop: 20, flexDirection: 'row', gap: 9 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E3E5EA' },
  activeDot: { backgroundColor: '#5C5CF4' },
  nextButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5C5CF4',
  },
  nextButtonPressed: { backgroundColor: '#4848D5' },
});
