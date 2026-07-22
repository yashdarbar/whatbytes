import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useAuthSession } from '@/features/auth';
import { TaskDetailsScreen, TaskFormScreen, useTask } from '@/features/tasks';
import { useAppTheme } from '@/theme';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const { user } = useAuthSession();
  const { data: task, isLoading } = useTask(user?.uid, id);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <AppText variant="title">Task not found</AppText>
      </View>
    );
  }

  return task.isCompleted ? <TaskDetailsScreen task={task} /> : <TaskFormScreen task={task} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
