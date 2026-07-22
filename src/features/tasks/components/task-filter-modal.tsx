import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
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

  useEffect(() => {
    if (visible) {
      setDraftPriority(priority);
      setDraftStatus(status);
    }
  }, [priority, status, visible]);

  function renderOption<T extends string>(
    item: { label: string; value: T },
    selected: boolean,
    onPress: (value: T) => void,
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        key={item.value}
        onPress={() => onPress(item.value)}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? theme.colors.primary : theme.colors.inputBackground,
            borderColor: selected ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        <AppText
          variant="label"
          style={{ color: selected ? '#FFFFFF' : theme.colors.textMuted, fontSize: 12 }}
        >
          {item.label}
        </AppText>
      </Pressable>
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
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
            {statuses.map((item) => renderOption(item, item.value === draftStatus, setDraftStatus))}
          </View>
        </View>

        <View style={styles.group}>
          <AppText variant="label">Priority</AppText>
          <View style={styles.options}>
            {priorities.map((item) =>
              renderOption(item, item.value === draftPriority, setDraftPriority),
            )}
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
