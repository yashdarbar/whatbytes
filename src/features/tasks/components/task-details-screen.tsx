import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Task, TaskPriority } from '../types';
import { AppText, Button, ChevronLeft } from '@/components/ui';
import { useAuthSession } from '@/features/auth';
import { useDeleteTask } from '@/features/tasks/hooks';
import { useAppTheme } from '@/theme';

type TaskDetailsScreenProps = {
  task: Task;
};

export function TaskDetailsScreen({ task }: TaskDetailsScreenProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthSession();
  const deleteTask = useDeleteTask();
  const priorityColors: Record<TaskPriority, string> = {
    low: theme.colors.priorityLow,
    medium: theme.colors.priorityMedium,
    high: theme.colors.priorityHigh,
  };
  const dueDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(task.dueDate);

  async function handleDelete() {
    if (!user) return;
    try {
      await deleteTask.mutateAsync({ userId: user.uid, taskId: task.id });
      router.back();
    } catch {
      // TanStack Query exposes the mapped error below.
    }
  }

  function confirmDelete() {
    Alert.alert('Delete task?', `“${task.title}” will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void handleDelete(),
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Back to tasks"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft color={theme.colors.primary} size={22} />
            <AppText variant="label" style={{ color: theme.colors.primary }}>
              Back
            </AppText>
          </Pressable>
          <AppText variant="title">Task details</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <View
          accessibilityLabel="Completed task"
          style={[styles.completedBadge, { backgroundColor: `${theme.colors.success}1F` }]}
        >
          <AppText variant="label" style={{ color: theme.colors.success }}>
            Completed
          </AppText>
        </View>

        <View style={[styles.detailsCard, theme.shadow, { backgroundColor: theme.colors.surface }]}>
          <DetailRow label="Title" value={task.title} />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <DetailRow
            label="Description"
            muted={!task.description}
            value={task.description || 'No description'}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <DetailRow label="Due date" value={dueDate} />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.detailRow}>
            <AppText muted style={styles.detailLabel}>
              Priority
            </AppText>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: `${priorityColors[task.priority]}22` },
              ]}
            >
              <AppText
                variant="label"
                style={{ color: priorityColors[task.priority], textTransform: 'capitalize' }}
              >
                {task.priority}
              </AppText>
            </View>
          </View>
        </View>

        {deleteTask.errorMessage ? (
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {deleteTask.errorMessage}
          </AppText>
        ) : null}

        <Button
          disabled={deleteTask.isPending}
          label={deleteTask.isPending ? 'Deleting…' : 'Delete task'}
          labelStyle={{ color: '#FFFFFF' }}
          onPress={confirmDelete}
          style={{ backgroundColor: theme.colors.danger }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, muted, value }: { label: string; muted?: boolean; value: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText muted style={styles.detailLabel}>
        {label}
      </AppText>
      <AppText muted={muted} selectable style={styles.detailValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { gap: 24, padding: 24, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerSpacer: { width: 54 },
  completedBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  detailsCard: { gap: 18, borderRadius: 18, padding: 20 },
  detailRow: { gap: 6 },
  detailLabel: { fontSize: 12, lineHeight: 18 },
  detailValue: { fontSize: 16, lineHeight: 24 },
  divider: { height: StyleSheet.hairlineWidth },
  priorityBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
});
