import { useEffect, useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { isSameDay, toDateKey } from '../task-view-utils';
import type { Task } from '../types';
import { AppText, ChevronLeft, ChevronRight } from '@/components/ui';
import { useAppTheme } from '@/theme';

import { TaskCard } from './task-card';

type TaskCalendarViewProps = {
  displayedMonth: Date;
  selectedDate: Date;
  tasks: Task[];
  selectedTasks: Task[];
  isLoading: boolean;
  disabled?: boolean;
  onDelete: (task: Task) => void;
  onOpen: (task: Task) => void;
  onComplete: (task: Task) => Promise<void>;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
};

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_TRANSITION_DURATION = 320;
const MONTH_TRANSITION_OFFSET = 14;
const MONTH_TRANSITION_EASING = Easing.inOut(Easing.cubic);
const CALENDAR_HORIZONTAL_INSET = 68;
const MAX_DAY_CIRCLE_SIZE = 31;
const MIN_DAY_CIRCLE_SIZE = 27;
const SWIPE_ACTIVATION_DISTANCE = 12;
const SWIPE_COMMIT_VELOCITY = 650;
const SWIPE_MAX_OFFSET = 110;
const SWIPE_COMMIT_OFFSET = 28;

/**
 * Renders a responsive month grid and the tasks for its selected day. Month
 * changes can be triggered by arrows or a horizontal swipe.
 */
export function TaskCalendarView({
  displayedMonth,
  selectedDate,
  tasks,
  selectedTasks,
  isLoading,
  disabled,
  onDelete,
  onOpen,
  onComplete,
  onMonthChange,
  onSelectDate,
}: TaskCalendarViewProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const monthOpacity = useRef(new Animated.Value(1)).current;
  const monthTranslateX = useRef(new Animated.Value(0)).current;
  const monthAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const swipeAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const monthAnimationFrame = useRef<number | null>(null);
  const displayedMonthRef = useRef(displayedMonth);
  const monthTransitioning = useRef(false);
  const swipeTransitioning = useRef(false);
  const reduceMotion = useRef(false);
  const swipeTranslateX = useRef(new Animated.Value(0)).current;
  const today = new Date();
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(displayedMonth);
  const selectedLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(selectedDate);
  const calendarCellWidth = (width - CALENDAR_HORIZONTAL_INSET) / 7;
  const dayCircleSize = Math.max(
    MIN_DAY_CIRCLE_SIZE,
    Math.min(MAX_DAY_CIRCLE_SIZE, calendarCellWidth - 6),
  );

  const taskDates = useMemo(() => new Set(tasks.map((task) => toDateKey(task.dueDate))), [tasks]);
  const days = useMemo(() => {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const leading = new Date(year, month, 1).getDay();
    const dayCount = new Date(year, month + 1, 0).getDate();
    // Null cells align day one beneath the correct weekday heading.
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: dayCount }, (_, index) => new Date(year, month, index + 1)),
    ];
  }, [displayedMonth]);

  useEffect(() => {
    displayedMonthRef.current = displayedMonth;
  }, [displayedMonth]);

  useEffect(() => {
    let isMounted = true;

    function finishAnimation() {
      monthAnimation.current?.stop();
      swipeAnimation.current?.stop();
      monthOpacity.setValue(1);
      monthTranslateX.setValue(0);
      swipeTranslateX.setValue(0);
      monthTransitioning.current = false;
      swipeTransitioning.current = false;
    }

    function handleReduceMotionChanged(isEnabled: boolean) {
      reduceMotion.current = isEnabled;
      if (isEnabled) finishAnimation();
    }

    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (!isMounted) return;
      reduceMotion.current = isEnabled;
      if (isEnabled) finishAnimation();
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      handleReduceMotionChanged,
    );

    return () => {
      isMounted = false;
      subscription.remove();
      monthAnimation.current?.stop();
      swipeAnimation.current?.stop();
      if (monthAnimationFrame.current !== null) {
        cancelAnimationFrame(monthAnimationFrame.current);
      }
    };
  }, [monthOpacity, monthTranslateX, swipeTranslateX]);

  function moveMonth(offset: number, interruptCurrentTransition = false) {
    if (interruptCurrentTransition) {
      monthAnimation.current?.stop();
      swipeAnimation.current?.stop();
      if (monthAnimationFrame.current !== null) {
        cancelAnimationFrame(monthAnimationFrame.current);
        monthAnimationFrame.current = null;
      }
      monthTransitioning.current = false;
      swipeTransitioning.current = false;
      swipeTranslateX.setValue(0);
    } else if (monthTransitioning.current || swipeTransitioning.current) {
      return;
    }

    monthTransitioning.current = true;
    const current = displayedMonthRef.current;
    const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    displayedMonthRef.current = next;
    monthAnimation.current?.stop();
    if (monthAnimationFrame.current !== null) {
      cancelAnimationFrame(monthAnimationFrame.current);
      monthAnimationFrame.current = null;
    }

    onMonthChange(next);
    onSelectDate(next);

    if (reduceMotion.current) {
      monthOpacity.setValue(1);
      monthTranslateX.setValue(0);
      monthTransitioning.current = false;
      return;
    }

    monthOpacity.setValue(0);
    monthTranslateX.setValue(offset > 0 ? MONTH_TRANSITION_OFFSET : -MONTH_TRANSITION_OFFSET);
    monthAnimationFrame.current = requestAnimationFrame(() => {
      monthAnimationFrame.current = null;
      monthAnimation.current = Animated.parallel([
        Animated.timing(monthOpacity, {
          duration: MONTH_TRANSITION_DURATION,
          easing: MONTH_TRANSITION_EASING,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(monthTranslateX, {
          duration: MONTH_TRANSITION_DURATION,
          easing: MONTH_TRANSITION_EASING,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]);
      monthAnimation.current.start(() => {
        monthTransitioning.current = false;
      });
    });
  }

  function resetSwipe() {
    swipeAnimation.current?.stop();

    if (reduceMotion.current) {
      swipeTranslateX.setValue(0);
      swipeTransitioning.current = false;
      return;
    }

    swipeAnimation.current = Animated.spring(swipeTranslateX, {
      bounciness: 5,
      speed: 17,
      toValue: 0,
      useNativeDriver: true,
    });
    swipeAnimation.current.start(() => {
      swipeTransitioning.current = false;
    });
  }

  function commitSwipe(offset: number) {
    swipeAnimation.current?.stop();
    swipeTransitioning.current = true;

    if (reduceMotion.current) {
      swipeTranslateX.setValue(0);
      swipeTransitioning.current = false;
      moveMonth(offset);
      return;
    }

    swipeAnimation.current = Animated.timing(swipeTranslateX, {
      duration: 120,
      easing: Easing.out(Easing.cubic),
      toValue: offset > 0 ? -SWIPE_COMMIT_OFFSET : SWIPE_COMMIT_OFFSET,
      useNativeDriver: true,
    });
    swipeAnimation.current.start(({ finished }) => {
      swipeTranslateX.setValue(0);
      swipeTransitioning.current = false;
      if (finished) moveMonth(offset);
    });
  }

  const swipeThreshold = Math.min(88, width * 0.2);
  // Vertical drift fails the gesture so scrolling the surrounding view remains natural.
  const monthSwipeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-SWIPE_ACTIVATION_DISTANCE, SWIPE_ACTIVATION_DISTANCE])
    .failOffsetY([-10, 10])
    .onBegin(() => {
      if (monthTransitioning.current || swipeTransitioning.current) return;
      swipeAnimation.current?.stop();
    })
    .onUpdate(({ translationX }) => {
      if (reduceMotion.current || monthTransitioning.current || swipeTransitioning.current) return;
      swipeTranslateX.setValue(
        Math.max(-SWIPE_MAX_OFFSET, Math.min(SWIPE_MAX_OFFSET, translationX)),
      );
    })
    .onEnd(({ translationX, velocityX }) => {
      if (monthTransitioning.current || swipeTransitioning.current) return;

      const shouldChangeMonth =
        Math.abs(translationX) >= swipeThreshold || Math.abs(velocityX) >= SWIPE_COMMIT_VELOCITY;

      if (!shouldChangeMonth) {
        // An incomplete gesture springs calmly back to the current month.
        swipeTransitioning.current = true;
        resetSwipe();
        return;
      }

      commitSwipe(translationX < 0 || (translationX === 0 && velocityX < 0) ? 1 : -1);
    })
    .onFinalize((_event, success) => {
      if (!success && !swipeTransitioning.current && !monthTransitioning.current) {
        swipeTransitioning.current = true;
        resetSwipe();
      }
    });

  const monthTransitionStyle = {
    opacity: monthOpacity,
    transform: [{ translateX: monthTranslateX }],
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <View style={[styles.calendarCard, theme.shadow, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.monthHeader}>
          <Pressable
            accessibilityLabel="Previous month"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => moveMonth(-1, true)}
            style={({ pressed }) => [styles.monthButton, pressed && styles.monthButtonPressed]}
          >
            <ChevronLeft color={theme.colors.textMuted} size={22} />
          </Pressable>
          <Animated.View style={[styles.monthLabelContainer, monthTransitionStyle]}>
            <AppText adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} variant="label">
              {monthLabel}
            </AppText>
          </Animated.View>
          <Pressable
            accessibilityLabel="Next month"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => moveMonth(1, true)}
            style={({ pressed }) => [styles.monthButton, pressed && styles.monthButtonPressed]}
          >
            <ChevronRight color={theme.colors.textMuted} size={22} />
          </Pressable>
        </View>

        <GestureDetector gesture={monthSwipeGesture}>
          <Animated.View style={{ transform: [{ translateX: swipeTranslateX }] }}>
            <View style={styles.weekRow}>
              {weekdayLabels.map((label, index) => (
                <AppText
                  key={`${label}-${index}`}
                  maxFontSizeMultiplier={1.4}
                  muted
                  style={styles.weekday}
                >
                  {label}
                </AppText>
              ))}
            </View>

            <Animated.View style={[styles.daysGrid, monthTransitionStyle]}>
              {days.map((date, index) => {
                if (!date) return <View key={`empty-${index}`} style={styles.dayCell} />;
                const selected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);
                const hasTasks = taskDates.has(toDateKey(date));
                return (
                  <Pressable
                    accessibilityLabel={new Intl.DateTimeFormat(undefined, {
                      dateStyle: 'full',
                    }).format(date)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={toDateKey(date)}
                    onPress={() => onSelectDate(date)}
                    style={styles.dayCell}
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        {
                          width: dayCircleSize,
                          height: dayCircleSize,
                          borderRadius: dayCircleSize / 2,
                        },
                        selected && { backgroundColor: theme.colors.primary },
                        isToday &&
                          !selected && { borderColor: theme.colors.primary, borderWidth: 1 },
                      ]}
                    >
                      <AppText
                        maxFontSizeMultiplier={1.4}
                        style={[
                          styles.dayText,
                          { color: selected ? '#FFFFFF' : theme.colors.text },
                        ]}
                      >
                        {date.getDate()}
                      </AppText>
                    </View>
                    {hasTasks ? (
                      <View
                        style={[styles.taskDot, { backgroundColor: theme.colors.priorityHigh }]}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>

      <Animated.View style={[styles.agenda, monthTransitionStyle]}>
        <AppText variant="label" style={styles.selectedLabel}>
          {selectedLabel}
        </AppText>
        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} size="large" style={styles.loader} />
        ) : selectedTasks.length ? (
          selectedTasks.map((task) => (
            <TaskCard
              disabled={disabled}
              key={task.id}
              task={task}
              onDelete={() => onDelete(task)}
              onOpen={() => onOpen(task)}
              onComplete={() => onComplete(task)}
            />
          ))
        ) : (
          <View style={[styles.noTasks, { borderColor: theme.colors.border }]}>
            <AppText muted style={styles.noTasksText}>
              No tasks due on this date.
            </AppText>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  content: { gap: 18, padding: 18, paddingBottom: 28 },
  calendarCard: { gap: 12, borderRadius: 18, padding: 16 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  monthButtonPressed: { opacity: 0.55, transform: [{ scale: 0.94 }] },
  monthLabelContainer: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 6 },
  weekRow: { flexDirection: 'row' },
  weekday: { width: '14.2857%', textAlign: 'center', fontSize: 11 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', height: 46, alignItems: 'center', justifyContent: 'center' },
  dayCircle: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  dayText: { fontSize: 12, lineHeight: 16 },
  taskDot: { position: 'absolute', bottom: 1, width: 4, height: 4, borderRadius: 2 },
  agenda: { gap: 8 },
  selectedLabel: { flexShrink: 1, marginBottom: 2, fontSize: 13 },
  noTasks: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 22,
  },
  noTasksText: { fontSize: 13 },
  loader: { padding: 24 },
});
