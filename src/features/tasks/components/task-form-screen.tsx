import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Task, TaskInput, TaskPriority } from '../types';
import { validateTask } from '../validation';
import { AppText, Button, Calendar, ChevronLeft } from '@/components/ui';
import { useAuthSession } from '@/features/auth';
import { useCreateTask, useUpdateTask } from '@/features/tasks/hooks';
import { useAppTheme } from '@/theme';

type TaskFormScreenProps = {
  task?: Task;
};

const priorities: TaskPriority[] = ['low', 'medium', 'high'];

function defaultDueDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Shared create/edit form. Passing a task switches the mutation and initial
 * values while retaining the same validation and responsive layout.
 */
export function TaskFormScreen({ task }: TaskFormScreenProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const { fontScale, width } = useWindowDimensions();
  const { user } = useAuthSession();
  const userId = user?.uid;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isMutating = createTask.isPending || updateTask.isPending;
  const requestError = createTask.errorMessage ?? updateTask.errorMessage;
  const useStackedPriorityLayout = fontScale >= 1.5 || (width < 360 && fontScale > 1.2);
  // Large accessibility text needs a vertical layout to prevent clipped priority labels.
  const priorityColors: Record<TaskPriority, string> = {
    low: theme.colors.priorityLow,
    medium: theme.colors.priorityMedium,
    high: theme.colors.priorityHigh,
  };
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDueDate());
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState(() =>
    validateTask({
      title: 'valid',
      description: '',
      dueDate: defaultDueDate(),
      priority: 'medium',
    }),
  );

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(dueDate),
    [dueDate],
  );

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      selectedDate.setHours(0, 0, 0, 0);
      setDueDate(selectedDate);
      setErrors((current) => ({ ...current, dueDate: undefined }));
    }
  }

  async function handleSubmit() {
    if (!userId) return;
    const input: TaskInput = { title, description, dueDate, priority };
    const nextErrors = validateTask(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      if (task) {
        await updateTask.mutateAsync({ userId, taskId: task.id, input });
      } else {
        await createTask.mutateAsync({ userId, input });
      }
      router.back();
    } catch {
      // TanStack Query exposes the mapped error below.
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.dashboardBackground }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
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
              {task ? 'Edit task' : 'New task'}
            </AppText>
            <View style={styles.backButtonPlaceholder} />
          </View>

          <View style={[styles.formCard, theme.shadow, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.field}>
              <AppText muted variant="label" style={styles.fieldLabel}>
                Title
              </AppText>
              <TextInput
                accessibilityLabel="Task title"
                autoFocus
                maxLength={120}
                onChangeText={(value) => {
                  setTitle(value);
                  createTask.reset();
                  updateTask.reset();
                  if (errors.title) setErrors((current) => ({ ...current, title: undefined }));
                }}
                placeholder="What needs to be done?"
                placeholderTextColor={theme.colors.placeholder}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    borderColor: errors.title ? theme.colors.danger : theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={title}
              />
              {errors.title ? (
                <AppText style={[styles.errorText, { color: theme.colors.danger }]}>
                  {errors.title}
                </AppText>
              ) : null}
            </View>

            <View style={styles.field}>
              <AppText muted variant="label" style={styles.fieldLabel}>
                Description
              </AppText>
              <TextInput
                accessibilityLabel="Task description"
                maxLength={2000}
                multiline
                onChangeText={(value) => {
                  setDescription(value);
                  createTask.reset();
                  updateTask.reset();
                }}
                placeholder="Add optional details"
                placeholderTextColor={theme.colors.placeholder}
                style={[
                  styles.input,
                  styles.description,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                textAlignVertical="top"
                value={description}
              />
            </View>

            <View style={styles.field}>
              <AppText muted variant="label" style={styles.fieldLabel}>
                Due date
              </AppText>
              <Pressable
                accessibilityLabel="Choose due date"
                accessibilityRole="button"
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.dateIcon}>
                  <Calendar color={theme.colors.primary} size={18} />
                </View>
                <AppText style={styles.dateText}>{formattedDate}</AppText>
              </Pressable>
              {showDatePicker ? (
                <DateTimePicker
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  mode="date"
                  onChange={handleDateChange}
                  value={dueDate}
                />
              ) : null}
            </View>

            <View style={styles.field}>
              <AppText muted variant="label" style={styles.fieldLabel}>
                Priority
              </AppText>
              <View
                style={[styles.priorityRow, useStackedPriorityLayout && styles.priorityRowStacked]}
              >
                {priorities.map((value) => {
                  const selected = priority === value;
                  const priorityColor = priorityColors[value];
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      hitSlop={{ top: 3, right: 0, bottom: 3, left: 0 }}
                      key={value}
                      onPress={() => setPriority(value)}
                      style={[
                        styles.priorityButton,
                        useStackedPriorityLayout && styles.priorityButtonStacked,
                        {
                          backgroundColor: selected
                            ? `${priorityColor}22`
                            : theme.colors.inputBackground,
                          borderColor: selected ? priorityColor : theme.colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="label"
                        style={[
                          styles.priorityText,
                          {
                            color: selected ? priorityColor : theme.colors.textMuted,
                          },
                        ]}
                      >
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {requestError ? (
            <AppText
              accessibilityRole="alert"
              style={[styles.requestError, { color: theme.colors.danger }]}
            >
              {requestError}
            </AppText>
          ) : null}

          <Button
            disabled={isMutating}
            label={isMutating ? 'Saving…' : task ? 'Save changes' : 'Create task'}
            onPress={handleSubmit}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  formCard: { gap: 17, borderRadius: 18, padding: 18 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, lineHeight: 18 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  description: { minHeight: 94, paddingTop: 12, paddingBottom: 12 },
  errorText: { fontSize: 11, lineHeight: 16 },
  dateButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateIcon: { flexShrink: 0 },
  dateText: { flex: 1, fontSize: 14, lineHeight: 20 },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityRowStacked: { flexDirection: 'column' },
  priorityButton: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 9,
  },
  priorityButtonStacked: { width: '100%', flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  priorityText: { fontSize: 12, lineHeight: 18 },
  requestError: { fontSize: 12, lineHeight: 18 },
  submitButton: { minHeight: 46 },
});
