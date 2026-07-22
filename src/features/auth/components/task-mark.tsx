import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

import { Check } from '@/components/ui/icons';

const AMBIENT_EASING = Easing.inOut(Easing.cubic);

export function TaskMark() {
  const motion = useRef({
    tile: new Animated.Value(0),
    orangeDot: new Animated.Value(0),
    navyDot: new Animated.Value(0),
    purpleDot: new Animated.Value(0),
    topSpark: new Animated.Value(0),
    leftSpark: new Animated.Value(0),
  }).current;
  const animations = useRef<Animated.CompositeAnimation[]>([]);
  const isAnimating = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const motionValues = Object.values(motion);

    function stopAnimation() {
      animations.current.forEach((animation) => animation.stop());
      animations.current = [];
      isAnimating.current = false;
      motionValues.forEach((value) => value.setValue(0));
    }

    function createLoop(value: Animated.Value, duration: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            duration: duration / 2,
            easing: AMBIENT_EASING,
            isInteraction: false,
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            duration: duration / 2,
            easing: AMBIENT_EASING,
            isInteraction: false,
            toValue: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    }

    function startAnimation() {
      if (isAnimating.current) return;

      animations.current = [
        createLoop(motion.tile, 4200),
        createLoop(motion.orangeDot, 3100),
        createLoop(motion.navyDot, 3600),
        createLoop(motion.purpleDot, 3300),
        createLoop(motion.topSpark, 2800),
        createLoop(motion.leftSpark, 3200),
      ];
      isAnimating.current = true;
      animations.current.forEach((animation) => animation.start());
    }

    function handleReduceMotionChanged(isEnabled: boolean) {
      if (isEnabled) stopAnimation();
      else startAnimation();
    }

    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (isMounted) handleReduceMotionChanged(isEnabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      handleReduceMotionChanged,
    );

    return () => {
      isMounted = false;
      subscription.remove();
      stopAnimation();
    };
  }, [motion]);

  const tileScale = motion.tile.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.018],
  });
  const orangeDotOpacity = motion.orangeDot.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.76],
  });
  const navyDotOpacity = motion.navyDot.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.72],
  });
  const purpleDotOpacity = motion.purpleDot.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.74],
  });
  const topSparkScale = motion.topSpark.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const topSparkRotation = motion.topSpark.interpolate({
    inputRange: [0, 1],
    outputRange: ['45deg', '47deg'],
  });
  const leftSparkScale = motion.leftSpark.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.07],
  });
  const leftSparkRotation = motion.leftSpark.interpolate({
    inputRange: [0, 1],
    outputRange: ['45deg', '43deg'],
  });

  return (
    <View accessibilityLabel="Task Management logo" style={styles.frame}>
      <Animated.View
        style={[
          styles.dot,
          styles.dotOrange,
          {
            opacity: orangeDotOpacity,
            transform: [
              {
                translateX: motion.orangeDot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1.5],
                }),
              },
              {
                translateY: motion.orangeDot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -2.5],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          styles.dotNavy,
          {
            opacity: navyDotOpacity,
            transform: [
              {
                translateX: motion.navyDot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -2],
                }),
              },
              {
                translateY: motion.navyDot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1.5],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          styles.dotPurple,
          {
            opacity: purpleDotOpacity,
            transform: [
              {
                translateX: motion.purpleDot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
              {
                translateY: motion.purpleDot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -2],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.spark,
          styles.sparkTop,
          {
            opacity: motion.topSpark.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.7],
            }),
            transform: [{ rotate: topSparkRotation }, { scale: topSparkScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.spark,
          styles.sparkLeft,
          {
            opacity: motion.leftSpark.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.72],
            }),
            transform: [{ rotate: leftSparkRotation }, { scale: leftSparkScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.tile,
          {
            transform: [
              {
                translateY: motion.tile.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -1],
                }),
              },
              { scale: tileScale },
            ],
          },
        ]}
      >
        <Check color="#FFFFFF" size={48} strokeWidth={4} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 138,
    height: 126,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#5C5CF4',
    shadowColor: '#4646C8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  dot: { position: 'absolute', width: 7, height: 7, borderRadius: 4 },
  dotOrange: { left: 13, top: 42, backgroundColor: '#F39132' },
  dotNavy: { right: 9, top: 51, backgroundColor: '#24375B' },
  dotPurple: { right: 20, bottom: 12, backgroundColor: '#6A5CF5' },
  spark: { position: 'absolute', width: 8, height: 8, backgroundColor: '#F5C94B' },
  sparkTop: { right: 22, top: 15 },
  sparkLeft: { left: 25, bottom: 20 },
});
