import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Task, TaskPriority } from '../types';
import { AppText, Button, Calendar, Check, ChevronLeft } from '@/components/ui';
import { useAuthSession } from '@/features/auth';
import { useDeleteTask } from '@/features/tasks/hooks';
import { useAppTheme } from '@/theme';

type TaskDetailsScreenProps = {
  task: Task;
};

/**
 * Read-only presentation for completed tasks. The edit route selects this
 * screen once a task is complete, matching the backend's one-way state rule.
 */
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.dashboardBackground }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Back to tasks"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={[
              styles.backButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <ChevronLeft color={theme.colors.primary} size={20} />
          </Pressable>
          <AppText variant="title" style={styles.headerTitle}>
            Task details
          </AppText>
          <View style={styles.backButtonPlaceholder} />
        </View>

        <View
          accessibilityLabel="Completed task"
          style={[styles.completedBadge, { backgroundColor: `${theme.colors.success}1F` }]}
        >
          <Check color={theme.colors.success} size={14} strokeWidth={2.5} />
          <AppText variant="label" style={[styles.completedText, { color: theme.colors.success }]}>
            Completed
          </AppText>
        </View>

        <View style={[styles.detailsCard, theme.shadow, { backgroundColor: theme.colors.surface }]}>
          <DetailField label="Title" value={task.title} />
          <DetailField
            description
            label="Description"
            muted={!task.description}
            value={task.description || 'No description'}
          />
          <View style={styles.field}>
            <AppText muted variant="label" style={styles.fieldLabel}>
              Due date
            </AppText>
            <View
              style={[
                styles.readOnlyField,
                styles.dateField,
                {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.dateIcon}>
                <Calendar color={theme.colors.primary} size={18} />
              </View>
              <AppText selectable style={[styles.fieldValue, styles.dateValue]}>
                {dueDate}
              </AppText>
            </View>
          </View>
          <View style={styles.field}>
            <AppText muted variant="label" style={styles.fieldLabel}>
              Priority
            </AppText>
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor: `${priorityColors[task.priority]}22`,
                  borderColor: priorityColors[task.priority],
                },
              ]}
            >
              <AppText
                variant="label"
                style={[
                  styles.priorityText,
                  { color: priorityColors[task.priority], textTransform: 'capitalize' },
                ]}
              >
                {task.priority}
              </AppText>
            </View>
          </View>
        </View>

        {deleteTask.errorMessage ? (
          <AppText
            accessibilityRole="alert"
            style={[styles.requestError, { color: theme.colors.danger }]}
          >
            {deleteTask.errorMessage}
          </AppText>
        ) : null}

        <Button
          disabled={deleteTask.isPending}
          label={deleteTask.isPending ? 'Deleting…' : 'Delete task'}
          labelStyle={{ color: '#FFFFFF' }}
          onPress={confirmDelete}
          style={[styles.deleteButton, { backgroundColor: theme.colors.deleteAction }]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailField({
  description = false,
  label,
  muted,
  value,
}: {
  description?: boolean;
  label: string;
  muted?: boolean;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.field}>
      <AppText muted variant="label" style={styles.fieldLabel}>
        {label}
      </AppText>
      <View
        style={[
          styles.readOnlyField,
          description && styles.descriptionField,
          { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border },
        ]}
      >
        <AppText muted={muted} selectable style={styles.fieldValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  content: { gap: 18, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  backButtonPlaceholder: { width: 38 },
  headerTitle: { fontSize: 18, lineHeight: 24 },
  completedBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completedText: { fontSize: 12, lineHeight: 18 },
  detailsCard: { gap: 17, borderRadius: 18, padding: 18 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, lineHeight: 18 },
  readOnlyField: {
    minHeight: 46,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  descriptionField: { minHeight: 94, justifyContent: 'flex-start' },
  fieldValue: { fontSize: 14, lineHeight: 20 },
  dateField: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  dateIcon: { flexShrink: 0, marginTop: 1 },
  dateValue: { flex: 1, minWidth: 0 },
  priorityBadge: {
    alignSelf: 'flex-start',
    minHeight: 38,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  priorityText: { fontSize: 12, lineHeight: 18 },
  requestError: { fontSize: 12, lineHeight: 18 },
  deleteButton: { minHeight: 46 },
});
