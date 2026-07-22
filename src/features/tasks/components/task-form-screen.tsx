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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Task, TaskInput, TaskPriority } from '../types';
import { validateTask } from '../validation';
import { AppText, Button, Calendar } from '@/components/ui';
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

export function TaskFormScreen({ task }: TaskFormScreenProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthSession();
  const userId = user?.uid;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isMutating = createTask.isPending || updateTask.isPending;
  const requestError = createTask.errorMessage ?? updateTask.errorMessage;
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={10}>
              <AppText variant="label" style={{ color: theme.colors.primary }}>
                Cancel
              </AppText>
            </Pressable>
            <AppText variant="title">{task ? 'Edit task' : 'New task'}</AppText>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.field}>
            <AppText variant="label">Title</AppText>
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
              <AppText style={{ color: theme.colors.danger }}>{errors.title}</AppText>
            ) : null}
          </View>

          <View style={styles.field}>
            <AppText variant="label">Description</AppText>
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
            <AppText variant="label">Due date</AppText>
            <Pressable
              accessibilityLabel="Choose due date"
              accessibilityRole="button"
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.dateButton,
                { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border },
              ]}
            >
              <Calendar color={theme.colors.primary} size={20} />
              <AppText>{formattedDate}</AppText>
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
            <AppText variant="label">Priority</AppText>
            <View style={styles.priorityRow}>
              {priorities.map((value) => {
                const selected = priority === value;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={value}
                    onPress={() => setPriority(value)}
                    style={[
                      styles.priorityButton,
                      {
                        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <AppText
                      variant="label"
                      style={{ color: selected ? theme.colors.onPrimary : theme.colors.text }}
                    >
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {requestError ? (
            <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
              {requestError}
            </AppText>
          ) : null}

          <Button
            disabled={isMutating}
            label={isMutating ? 'Saving…' : task ? 'Save changes' : 'Create task'}
            onPress={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  content: { gap: 24, padding: 24, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSpacer: { width: 46 },
  field: { gap: 8 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, fontSize: 16 },
  description: { minHeight: 120, paddingTop: 14 },
  dateButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
});
