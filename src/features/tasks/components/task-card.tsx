import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import type { Task, TaskPriority } from '../types';
import { AppText, Check, Trash } from '@/components/ui';
import { useAppTheme } from '@/theme';

type TaskCardProps = {
  task: Task;
  disabled?: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onComplete: () => Promise<void>;
};

const COMPLETION_DURATION = 360;
const COMPLETION_ROLLBACK_DURATION = 240;
const COMPLETION_EASING = Easing.out(Easing.cubic);
const SWIPE_SPRING_OPTIONS = { bounciness: 4, speed: 18 };

export function TaskCard({ task, disabled, onOpen, onDelete, onComplete }: TaskCardProps) {
  const theme = useAppTheme();
  const { fontScale, width } = useWindowDimensions();
  const swipeableRef = useRef<Swipeable>(null);
  const completionAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const completionProgress = useRef(new Animated.Value(task.isCompleted ? 1 : 0)).current;
  const successWash = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);
  const completionStarted = useRef(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompletedStyle, setShowCompletedStyle] = useState(task.isCompleted);
  const useExpandedTitle = width < 360 || fontScale > 1.2;
  const cardDisabled = Boolean(disabled || isCompleting);
  const completionDisabled = cardDisabled || task.isCompleted;
  const priorityColors: Record<TaskPriority, string> = {
    low: theme.colors.priorityLow,
    medium: theme.colors.priorityMedium,
    high: theme.colors.priorityHigh,
  };
  const priorityColor = priorityColors[task.priority];
  const dueDate = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(task.dueDate);

  useEffect(() => {
    if (task.isCompleted) {
      completionProgress.setValue(1);
      successWash.setValue(0);
      completionStarted.current = true;
      setShowCompletedStyle(true);
      setIsCompleting(false);
    }
  }, [completionProgress, successWash, task.isCompleted]);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      completionAnimation.current?.stop();
    };
  }, []);

  function requestDelete() {
    swipeableRef.current?.close();
    onDelete();
  }

  async function requestCompletion() {
    if (completionDisabled || completionStarted.current) return;
    swipeableRef.current?.close();
    completionStarted.current = true;
    setIsCompleting(true);

    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
    if (!isMounted.current) return;

    if (reduceMotion) {
      completionProgress.setValue(1);
      setShowCompletedStyle(true);
    } else {
      await new Promise<void>((resolve) => {
        completionAnimation.current = Animated.parallel([
          Animated.timing(completionProgress, {
            duration: COMPLETION_DURATION,
            easing: COMPLETION_EASING,
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(successWash, {
              duration: 170,
              easing: COMPLETION_EASING,
              toValue: 1,
              useNativeDriver: true,
            }),
            Animated.timing(successWash, {
              duration: 230,
              easing: Easing.inOut(Easing.cubic),
              toValue: 0,
              useNativeDriver: true,
            }),
          ]),
        ]);
        completionAnimation.current.start(() => resolve());
      });
      if (!isMounted.current) return;
      setShowCompletedStyle(true);
    }

    try {
      await onComplete();
    } catch {
      if (!isMounted.current) return;
      setShowCompletedStyle(false);
      completionAnimation.current = Animated.parallel([
        Animated.timing(completionProgress, {
          duration: reduceMotion ? 0 : COMPLETION_ROLLBACK_DURATION,
          easing: Easing.inOut(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(successWash, {
          duration: 0,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]);
      completionAnimation.current.start(() => {
        if (!isMounted.current) return;
        completionStarted.current = false;
        setIsCompleting(false);
      });
    }
  }

  const checkFillStyle = {
    opacity: completionProgress,
    transform: [
      {
        scale: completionProgress.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [0.65, 1.12, 1],
        }),
      },
    ],
  };
  const checkIconStyle = {
    opacity: completionProgress,
    transform: [
      {
        scale: completionProgress.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [0.45, 1.14, 1],
        }),
      },
    ],
  };
  const titleAnimationStyle = {
    opacity: completionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.45],
    }),
  };

  return (
    <View style={[styles.shadowContainer, theme.shadow, { backgroundColor: theme.colors.surface }]}>
      <Swipeable
        animationOptions={SWIPE_SPRING_OPTIONS}
        ref={swipeableRef}
        enabled={!cardDisabled}
        friction={2}
        leftThreshold={36}
        overshootFriction={8}
        overshootLeft
        overshootRight
        renderLeftActions={
          task.isCompleted
            ? undefined
            : () => (
                <Pressable
                  accessibilityLabel={`Complete ${task.title}`}
                  accessibilityRole="button"
                  disabled={completionDisabled}
                  onPress={() => void requestCompletion()}
                  style={({ pressed }) => [
                    styles.completeAction,
                    { backgroundColor: theme.colors.success, opacity: pressed ? 0.82 : 1 },
                  ]}
                >
                  <Check color="#FFFFFF" size={22} strokeWidth={3} />
                </Pressable>
              )
        }
        rightThreshold={36}
        renderRightActions={() => (
          <Pressable
            accessibilityLabel={`Delete ${task.title}`}
            accessibilityRole="button"
            disabled={cardDisabled}
            onPress={requestDelete}
            style={({ pressed }) => [
              styles.deleteAction,
              { backgroundColor: theme.colors.deleteAction, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <Trash color="#FFFFFF" size={22} />
          </Pressable>
        )}
      >
        <Pressable
          accessibilityActions={[{ name: 'activate' }, { name: 'delete', label: 'Delete task' }]}
          accessibilityLabel={`Open ${task.title}`}
          accessibilityRole="button"
          disabled={cardDisabled}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'delete') requestDelete();
            else if (event.nativeEvent.actionName === 'activate') onOpen();
          }}
          onPress={onOpen}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.successWash,
              { backgroundColor: theme.colors.success, opacity: successWash },
            ]}
          />

          <Pressable
            accessibilityLabel={
              task.isCompleted ? `${task.title} completed` : `Complete ${task.title}`
            }
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: task.isCompleted || showCompletedStyle,
              disabled: completionDisabled,
            }}
            disabled={completionDisabled}
            hitSlop={10}
            onPress={(event) => {
              event.stopPropagation();
              void requestCompletion();
            }}
            style={[styles.checkButton, { borderColor: theme.colors.primary }]}
          >
            <Animated.View
              style={[styles.checkFill, { backgroundColor: theme.colors.primary }, checkFillStyle]}
            />
            <Animated.View style={[styles.checkIcon, checkIconStyle]}>
              <Check color="#FFFFFF" size={13} strokeWidth={3} />
            </Animated.View>
          </Pressable>

          <View style={styles.content}>
            <Animated.View style={titleAnimationStyle}>
              <AppText
                numberOfLines={useExpandedTitle ? 2 : 1}
                style={[styles.title, showCompletedStyle && styles.completedText]}
              >
                {task.title}
              </AppText>
            </Animated.View>
            <AppText muted numberOfLines={1} style={styles.date}>
              {dueDate}
              {task.description ? ` · ${task.description}` : ''}
            </AppText>
          </View>

          <View style={[styles.priorityPill, { backgroundColor: `${priorityColor}22` }]}>
            <AppText
              maxFontSizeMultiplier={1.3}
              variant="label"
              style={[styles.priorityText, { color: priorityColor }]}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </AppText>
          </View>
        </Pressable>
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: { borderRadius: 14 },
  card: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  checkButton: {
    width: 19,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  checkFill: {
    ...StyleSheet.absoluteFillObject,
    top: -1.5,
    right: -1.5,
    bottom: -1.5,
    left: -1.5,
    borderRadius: 10,
  },
  checkIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successWash: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, lineHeight: 20 },
  completedText: { textDecorationLine: 'line-through' },
  date: { fontSize: 11, lineHeight: 16 },
  priorityPill: { flexShrink: 0, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  priorityText: { fontSize: 10, lineHeight: 14 },
  deleteAction: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginLeft: 8,
  },
  completeAction: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginRight: 8,
  },
});
