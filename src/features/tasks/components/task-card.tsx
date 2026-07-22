import { useRef } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import type { Task, TaskPriority } from '../types';
import { AppText, Check, Trash } from '@/components/ui';
import { useAppTheme } from '@/theme';

type TaskCardProps = {
  task: Task;
  disabled?: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onComplete: () => void;
};

export function TaskCard({ task, disabled, onOpen, onDelete, onComplete }: TaskCardProps) {
  const theme = useAppTheme();
  const { fontScale, width } = useWindowDimensions();
  const swipeableRef = useRef<Swipeable>(null);
  const useExpandedTitle = width < 360 || fontScale > 1.2;
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

  function requestDelete() {
    swipeableRef.current?.close();
    onDelete();
  }

  return (
    <View style={[styles.shadowContainer, theme.shadow, { backgroundColor: theme.colors.surface }]}>
      <Swipeable
        ref={swipeableRef}
        enabled={!disabled}
        friction={2}
        overshootRight={false}
        rightThreshold={36}
        renderRightActions={() => (
          <Pressable
            accessibilityLabel={`Delete ${task.title}`}
            accessibilityRole="button"
            disabled={disabled}
            onPress={requestDelete}
            style={({ pressed }) => [
              styles.deleteAction,
              { backgroundColor: theme.colors.danger, opacity: pressed ? 0.82 : 1 },
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
          disabled={disabled}
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
              opacity: pressed || disabled ? 0.72 : 1,
            },
          ]}
        >
          {task.isCompleted ? (
            <View
              accessibilityLabel={`${task.title} completed`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: true, disabled: true }}
              style={[
                styles.checkButton,
                { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ]}
            >
              <Check color="#FFFFFF" size={13} strokeWidth={3} />
            </View>
          ) : (
            <Pressable
              accessibilityLabel={`Complete ${task.title}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: false }}
              disabled={disabled}
              hitSlop={10}
              onPress={(event) => {
                event.stopPropagation();
                onComplete();
              }}
              style={[
                styles.checkButton,
                { backgroundColor: 'transparent', borderColor: theme.colors.primary },
              ]}
            />
          )}

          <View style={styles.content}>
            <AppText
              numberOfLines={useExpandedTitle ? 2 : 1}
              style={[styles.title, task.isCompleted && styles.completedText]}
            >
              {task.title}
            </AppText>
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
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, lineHeight: 20 },
  completedText: { opacity: 0.45, textDecorationLine: 'line-through' },
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
});
