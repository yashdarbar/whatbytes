import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Animated, Easing, StyleSheet, View } from 'react-native';
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

const DASHBOARD_ENTRANCE_DURATION = 700;
const DASHBOARD_ENTRANCE_OFFSET = 14;
const VIEW_TRANSITION_DURATION = 520;
const VIEW_TRANSITION_OFFSET = 10;
const CALM_EASING = Easing.inOut(Easing.cubic);

/**
 * Coordinates the task list, calendar, filters, task mutations, and the calm
 * transitions between the dashboard's two views.
 */
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
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(DASHBOARD_ENTRANCE_OFFSET)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);
  const selectedView = useRef(viewMode);
  const screenAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const contentAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const contentAnimationFrame = useRef<number | null>(null);
  const isMutating = deleteTask.isPending || completeTask.isPending;
  const error =
    deleteTask.errorMessage ??
    completeTask.errorMessage ??
    signOut.errorMessage ??
    sectionsQuery.error?.message ??
    visibleTasksQuery.error?.message;
  const hasActiveFilters = priorityFilter !== 'all' || statusFilter !== 'all';
  const hasActiveQuery = hasActiveFilters || Boolean(searchQuery.trim());

  useEffect(() => {
    let isMounted = true;

    function finishAnimations() {
      screenAnimation.current?.stop();
      contentAnimation.current?.stop();
      screenOpacity.setValue(1);
      screenTranslateY.setValue(0);
      contentOpacity.setValue(1);
      contentTranslateY.setValue(0);
    }

    function handleReduceMotionChanged(isEnabled: boolean) {
      // Accessibility preference takes effect immediately, including mid-animation.
      reduceMotion.current = isEnabled;
      if (isEnabled) finishAnimations();
    }

    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (!isMounted) return;
      reduceMotion.current = isEnabled;

      if (isEnabled) {
        finishAnimations();
        return;
      }

      screenAnimation.current = Animated.parallel([
        Animated.timing(screenOpacity, {
          duration: DASHBOARD_ENTRANCE_DURATION,
          easing: CALM_EASING,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateY, {
          duration: DASHBOARD_ENTRANCE_DURATION,
          easing: CALM_EASING,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]);
      screenAnimation.current.start();
    });

    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      handleReduceMotionChanged,
    );

    return () => {
      isMounted = false;
      reduceMotionSubscription.remove();
      screenAnimation.current?.stop();
      contentAnimation.current?.stop();
      if (contentAnimationFrame.current !== null) {
        cancelAnimationFrame(contentAnimationFrame.current);
      }
    };
  }, [contentOpacity, contentTranslateY, screenOpacity, screenTranslateY]);

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

  async function markComplete(task: Task) {
    if (!user || task.isCompleted) return;
    await completeTask.mutateAsync({
      userId: user.uid,
      taskId: task.id,
    });
  }

  function changeView(nextView: typeof viewMode) {
    if (nextView === selectedView.current) return;
    selectedView.current = nextView;
    contentAnimation.current?.stop();
    if (contentAnimationFrame.current !== null) {
      cancelAnimationFrame(contentAnimationFrame.current);
      contentAnimationFrame.current = null;
    }

    if (reduceMotion.current) {
      contentOpacity.setValue(1);
      contentTranslateY.setValue(0);
      setViewMode(nextView);
      return;
    }

    contentOpacity.setValue(0);
    contentTranslateY.setValue(VIEW_TRANSITION_OFFSET);
    setViewMode(nextView);
    contentAnimationFrame.current = requestAnimationFrame(() => {
      contentAnimationFrame.current = null;
      contentAnimation.current = Animated.parallel([
        Animated.timing(contentOpacity, {
          duration: VIEW_TRANSITION_DURATION,
          easing: CALM_EASING,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          duration: VIEW_TRANSITION_DURATION,
          easing: CALM_EASING,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]);
      contentAnimation.current.start();
    });
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.colors.header }]}
    >
      <Animated.View
        needsOffscreenAlphaCompositing
        renderToHardwareTextureAndroid
        style={[
          styles.dashboard,
          { opacity: screenOpacity, transform: [{ translateY: screenTranslateY }] },
        ]}
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
              <AppText
                accessibilityRole="alert"
                style={{ color: theme.colors.danger, fontSize: 12 }}
              >
                {error}
              </AppText>
            </View>
          ) : null}

          <Animated.View
            needsOffscreenAlphaCompositing
            renderToHardwareTextureAndroid
            style={[
              styles.content,
              { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] },
            ]}
          >
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
          </Animated.View>

          <TaskBottomNavigation
            value={viewMode}
            onChange={changeView}
            onCreate={() => router.push('/tasks/new' as Href)}
          />
        </View>
      </Animated.View>

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
  dashboard: { flex: 1 },
  body: { flex: 1, overflow: 'hidden' },
  content: { flex: 1 },
  errorBanner: { paddingHorizontal: 18, paddingVertical: 8 },
});
