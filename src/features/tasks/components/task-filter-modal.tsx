import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { TaskPriorityFilter, TaskStatusFilter } from '../types';
import { AppText, X } from '@/components/ui';
import { useAppTheme } from '@/theme';

type TaskFilterModalProps = {
  priority: TaskPriorityFilter;
  status: TaskStatusFilter;
  visible: boolean;
  onApply: (priority: TaskPriorityFilter, status: TaskStatusFilter) => void;
  onClose: () => void;
};

const priorities: { label: string; value: TaskPriorityFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

const statuses: { label: string; value: TaskStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Incomplete', value: 'incomplete' },
  { label: 'Completed', value: 'completed' },
];

const CHIP_TRANSITION_DURATION = 240;
const CHIP_TRANSITION_EASING = Easing.inOut(Easing.cubic);
const SHEET_OPEN_DURATION = 420;
const SHEET_CLOSE_DURATION = 280;
const SHEET_ENTRANCE_OFFSET = 28;
const SHEET_TRANSITION_EASING = Easing.inOut(Easing.cubic);

type FilterChipProps<T extends string> = {
  item: { label: string; value: T };
  reduceMotion: boolean;
  selected: boolean;
  onPress: (value: T) => void;
};

function FilterChip<T extends string>({
  item,
  reduceMotion,
  selected,
  onPress,
}: FilterChipProps<T>) {
  const theme = useAppTheme();
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animation.current?.stop();

    if (reduceMotion) {
      progress.setValue(selected ? 1 : 0);
      return;
    }

    animation.current = Animated.timing(progress, {
      duration: CHIP_TRANSITION_DURATION,
      easing: CHIP_TRANSITION_EASING,
      toValue: selected ? 1 : 0,
      useNativeDriver: false,
    });
    animation.current.start();

    return () => animation.current?.stop();
  }, [progress, reduceMotion, selected]);

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.inputBackground, theme.colors.primary],
  });
  const borderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.primary],
  });
  const labelColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.textMuted, '#FFFFFF'],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.985, 1],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onPress(item.value)}
    >
      <Animated.View
        style={[styles.chip, { backgroundColor, borderColor, transform: [{ scale }] }]}
      >
        <Animated.Text style={[theme.typography.label, styles.chipLabel, { color: labelColor }]}>
          {item.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Keeps filter edits as drafts until Apply is pressed and retains the modal
 * in the tree long enough for its close animation to finish.
 */
export function TaskFilterModal({
  priority,
  status,
  visible,
  onApply,
  onClose,
}: TaskFilterModalProps) {
  const theme = useAppTheme();
  const { height } = useWindowDimensions();
  const [draftPriority, setDraftPriority] = useState(priority);
  const [draftStatus, setDraftStatus] = useState(status);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isRendered, setIsRendered] = useState(visible);
  const transitionProgress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const transitionAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const transitionFrame = useRef<number | null>(null);
  const reduceMotionRef = useRef(false);
  const visibleRef = useRef(visible);

  useEffect(() => {
    if (visible) {
      setDraftPriority(priority);
      setDraftStatus(status);
    }
  }, [priority, status, visible]);

  useEffect(() => {
    let isMounted = true;

    function finishForReducedMotion(isEnabled: boolean) {
      reduceMotionRef.current = isEnabled;
      setReduceMotion(isEnabled);

      if (!isEnabled) return;

      transitionAnimation.current?.stop();
      if (transitionFrame.current !== null) {
        cancelAnimationFrame(transitionFrame.current);
        transitionFrame.current = null;
      }
      transitionProgress.setValue(visibleRef.current ? 1 : 0);
      if (!visibleRef.current) setIsRendered(false);
    }

    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (isMounted) finishForReducedMotion(isEnabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      finishForReducedMotion,
    );

    return () => {
      isMounted = false;
      subscription.remove();
      transitionAnimation.current?.stop();
      if (transitionFrame.current !== null) cancelAnimationFrame(transitionFrame.current);
    };
  }, [transitionProgress]);

  useEffect(() => {
    visibleRef.current = visible;
    transitionAnimation.current?.stop();
    if (transitionFrame.current !== null) {
      cancelAnimationFrame(transitionFrame.current);
      transitionFrame.current = null;
    }

    if (reduceMotionRef.current) {
      transitionProgress.setValue(visible ? 1 : 0);
      setIsRendered(visible);
      return;
    }

    if (visible) {
      // Render first, then animate on the next frame so the entrance is visible.
      setIsRendered(true);
      transitionProgress.setValue(0);
      transitionFrame.current = requestAnimationFrame(() => {
        transitionFrame.current = null;
        transitionAnimation.current = Animated.timing(transitionProgress, {
          duration: SHEET_OPEN_DURATION,
          easing: SHEET_TRANSITION_EASING,
          toValue: 1,
          useNativeDriver: true,
        });
        transitionAnimation.current.start();
      });
      return;
    }

    transitionAnimation.current = Animated.timing(transitionProgress, {
      duration: SHEET_CLOSE_DURATION,
      easing: SHEET_TRANSITION_EASING,
      toValue: 0,
      useNativeDriver: true,
    });
    transitionAnimation.current.start(({ finished }) => {
      // Unmounting after the animation prevents the sheet from disappearing abruptly.
      if (finished && !visibleRef.current) setIsRendered(false);
    });
  }, [transitionProgress, visible]);

  const backdropOpacity = transitionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const sheetOpacity = transitionProgress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.35, 1],
  });
  const sheetTranslateY = transitionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_ENTRANCE_OFFSET, 0],
  });
  const sheetScale = transitionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={isRendered}>
      <View pointerEvents={visible ? 'auto' : 'none'} style={styles.modalContent}>
        <Animated.View style={[styles.overlayContainer, { opacity: backdropOpacity }]}>
          <Pressable style={styles.overlay} onPress={onClose} />
        </Animated.View>
        <Animated.View
          needsOffscreenAlphaCompositing
          renderToHardwareTextureAndroid
          style={{
            opacity: sheetOpacity,
            transform: [{ translateY: sheetTranslateY }, { scale: sheetScale }],
          }}
        >
          <SafeAreaView
            edges={['bottom']}
            style={[
              styles.sheet,
              {
                maxHeight: height * 0.9,
                backgroundColor: theme.colors.dashboardBackground,
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <AppText variant="title">Filter tasks</AppText>
              <Pressable accessibilityLabel="Close filters" hitSlop={10} onPress={onClose}>
                <X color={theme.colors.text} size={22} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.groups}
              showsVerticalScrollIndicator={false}
              style={styles.groupsScroll}
            >
              <View style={styles.group}>
                <AppText variant="label">Status</AppText>
                <View style={styles.options}>
                  {statuses.map((item) => (
                    <FilterChip
                      item={item}
                      key={item.value}
                      reduceMotion={reduceMotion}
                      selected={item.value === draftStatus}
                      onPress={setDraftStatus}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.group}>
                <AppText variant="label">Priority</AppText>
                <View style={styles.options}>
                  {priorities.map((item) => (
                    <FilterChip
                      item={item}
                      key={item.value}
                      reduceMotion={reduceMotion}
                      selected={item.value === draftPriority}
                      onPress={setDraftPriority}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setDraftPriority('all');
                  setDraftStatus('all');
                }}
                style={[styles.action, { borderColor: theme.colors.border }]}
              >
                <AppText variant="label">Reset</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onApply(draftPriority, draftStatus)}
                style={[
                  styles.action,
                  styles.applyAction,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <AppText variant="label" style={{ color: '#FFFFFF' }}>
                  Apply filters
                </AppText>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: { flex: 1, justifyContent: 'flex-end' },
  overlayContainer: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, backgroundColor: 'rgba(16,19,26,0.38)' },
  sheet: { gap: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupsScroll: { flexShrink: 1 },
  groups: { gap: 24 },
  group: { gap: 10 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  chipLabel: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 12 },
  action: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  applyAction: { flex: 1, borderWidth: 0 },
});
