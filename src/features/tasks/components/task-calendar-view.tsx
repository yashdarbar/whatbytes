import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
  onComplete: (task: Task) => void;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
};

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

  const taskDates = useMemo(() => new Set(tasks.map((task) => toDateKey(task.dueDate))), [tasks]);
  const days = useMemo(() => {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const leading = new Date(year, month, 1).getDay();
    const dayCount = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: dayCount }, (_, index) => new Date(year, month, index + 1)),
    ];
  }, [displayedMonth]);

  function moveMonth(offset: number) {
    const next = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + offset, 1);
    onMonthChange(next);
    onSelectDate(next);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.calendarCard, theme.shadow, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.monthHeader}>
          <Pressable accessibilityLabel="Previous month" hitSlop={9} onPress={() => moveMonth(-1)}>
            <ChevronLeft color={theme.colors.textMuted} size={22} />
          </Pressable>
          <AppText variant="label">{monthLabel}</AppText>
          <Pressable accessibilityLabel="Next month" hitSlop={9} onPress={() => moveMonth(1)}>
            <ChevronRight color={theme.colors.textMuted} size={22} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {weekdayLabels.map((label, index) => (
            <AppText key={`${label}-${index}`} muted style={styles.weekday}>
              {label}
            </AppText>
          ))}
        </View>

        <View style={styles.daysGrid}>
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
                    selected && { backgroundColor: theme.colors.primary },
                    isToday && !selected && { borderColor: theme.colors.primary, borderWidth: 1 },
                  ]}
                >
                  <AppText
                    style={[styles.dayText, { color: selected ? '#FFFFFF' : theme.colors.text }]}
                  >
                    {date.getDate()}
                  </AppText>
                </View>
                {hasTasks ? (
                  <View
                    style={[
                      styles.taskDot,
                      { backgroundColor: selected ? '#FFFFFF' : theme.colors.priorityHigh },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.agenda}>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18, padding: 18, paddingBottom: 28 },
  calendarCard: { gap: 12, borderRadius: 18, padding: 16 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekRow: { flexDirection: 'row' },
  weekday: { width: '14.2857%', textAlign: 'center', fontSize: 11 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', height: 43, alignItems: 'center', justifyContent: 'center' },
  dayCircle: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  dayText: { fontSize: 12, lineHeight: 16 },
  taskDot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2 },
  agenda: { gap: 8 },
  selectedLabel: { marginBottom: 2, fontSize: 13 },
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
