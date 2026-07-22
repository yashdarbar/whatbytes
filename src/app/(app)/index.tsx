import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { useAuthSession, useSignOut } from '@/features/auth';
import {
  DashboardHeader,
  TaskBottomNavigation,
  TaskCalendarView,
  TaskFilterModal,
  TaskSectionList,
  useCompleteTask,
  useDeleteTask,
  useTaskFilters,
  useTaskSections,
  useTasksForDate,
  useTaskView,
  useVisibleTasks,
  type Task,
} from '@/features/tasks';
import { useAppTheme } from '@/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthSession();
  const signOut = useSignOut();
  const sectionsQuery = useTaskSections(user?.uid);
  const visibleTasksQuery = useVisibleTasks(user?.uid);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [displayedMonth, setDisplayedMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const selectedTasksQuery = useTasksForDate(user?.uid, selectedDate);
  const {
    priorityFilter,
    statusFilter,
    searchQuery,
    setPriorityFilter,
    setStatusFilter,
    setSearchQuery,
    resetViewState,
  } = useTaskFilters();
  const { viewMode, setViewMode } = useTaskView();
  const deleteTask = useDeleteTask();
  const completeTask = useCompleteTask();
  const [filtersVisible, setFiltersVisible] = useState(false);
  const isMutating = deleteTask.isPending || completeTask.isPending;
  const error =
    deleteTask.errorMessage ??
    completeTask.errorMessage ??
    signOut.errorMessage ??
    sectionsQuery.error?.message ??
    visibleTasksQuery.error?.message;
  const hasActiveFilters = priorityFilter !== 'all' || statusFilter !== 'all';
  const hasActiveQuery = hasActiveFilters || Boolean(searchQuery.trim());

  async function handleSignOut() {
    try {
      await signOut.mutateAsync();
      resetViewState();
      router.replace('/(auth)/login');
    } catch {
      // The account menu remains available so the request can be retried.
    }
  }

  function confirmDelete(task: Task) {
    if (!user) return;
    Alert.alert('Delete task?', `“${task.title}” will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void deleteTask.mutate({ userId: user.uid, taskId: task.id }),
      },
    ]);
  }

  function openTask(task: Task) {
    router.push(`/tasks/${task.id}` as Href);
  }

  function markComplete(task: Task) {
    if (!user || task.isCompleted) return;
    completeTask.mutate({
      userId: user.uid,
      taskId: task.id,
    });
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.colors.header }]}
    >
      <DashboardHeader
        email={user?.email}
        hasActiveFilters={hasActiveFilters}
        isSigningOut={signOut.isPending}
        searchQuery={searchQuery}
        onFilterPress={() => setFiltersVisible(true)}
        onSearchChange={setSearchQuery}
        onSignOut={() => void handleSignOut()}
      />

      <View style={[styles.body, { backgroundColor: theme.colors.dashboardBackground }]}>
        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: `${theme.colors.danger}16` }]}>
            <AppText accessibilityRole="alert" style={{ color: theme.colors.danger, fontSize: 12 }}>
              {error}
            </AppText>
          </View>
        ) : null}

        <View style={styles.content}>
          {viewMode === 'list' ? (
            <TaskSectionList
              disabled={isMutating}
              hasActiveQuery={hasActiveQuery}
              isLoading={sectionsQuery.isLoading}
              sections={sectionsQuery.data}
              onDelete={confirmDelete}
              onOpen={openTask}
              onComplete={markComplete}
            />
          ) : (
            <TaskCalendarView
              disabled={isMutating}
              displayedMonth={displayedMonth}
              isLoading={visibleTasksQuery.isLoading}
              selectedDate={selectedDate}
              selectedTasks={selectedTasksQuery.data}
              tasks={visibleTasksQuery.data}
              onDelete={confirmDelete}
              onOpen={openTask}
              onComplete={markComplete}
              onMonthChange={setDisplayedMonth}
              onSelectDate={setSelectedDate}
            />
          )}
        </View>

        <TaskBottomNavigation
          value={viewMode}
          onChange={setViewMode}
          onCreate={() => router.push('/tasks/new' as Href)}
        />
      </View>

      <TaskFilterModal
        priority={priorityFilter}
        status={statusFilter}
        visible={filtersVisible}
        onApply={(priority, status) => {
          setPriorityFilter(priority);
          setStatusFilter(status);
          setFiltersVisible(false);
        }}
        onClose={() => setFiltersVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  body: { flex: 1, overflow: 'hidden' },
  content: { flex: 1 },
  errorBanner: { paddingHorizontal: 18, paddingVertical: 8 },
});
