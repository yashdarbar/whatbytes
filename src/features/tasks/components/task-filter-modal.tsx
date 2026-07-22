import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
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

export function TaskFilterModal({
  priority,
  status,
  visible,
  onApply,
  onClose,
}: TaskFilterModalProps) {
  const theme = useAppTheme();
  const [draftPriority, setDraftPriority] = useState(priority);
  const [draftStatus, setDraftStatus] = useState(status);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraftPriority(priority);
      setDraftStatus(status);
    }
  }, [priority, status, visible]);

  useEffect(() => {
    let isMounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (isMounted) setReduceMotion(isEnabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.sheet, { backgroundColor: theme.colors.dashboardBackground }]}
      >
        <View style={styles.sheetHeader}>
          <AppText variant="title">Filter tasks</AppText>
          <Pressable accessibilityLabel="Close filters" hitSlop={10} onPress={onClose}>
            <X color={theme.colors.text} size={22} />
          </Pressable>
        </View>

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
            style={[styles.action, styles.applyAction, { backgroundColor: theme.colors.primary }]}
          >
            <AppText variant="label" style={{ color: '#FFFFFF' }}>
              Apply filters
            </AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(16,19,26,0.38)' },
  sheet: { gap: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  group: { gap: 10 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 15,
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
  },
  applyAction: { flex: 1, borderWidth: 0 },
});
