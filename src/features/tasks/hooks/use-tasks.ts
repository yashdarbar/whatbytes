import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import {
  completeTask,
  createTask,
  deleteTask,
  getTaskErrorMessage,
  getTasks,
  subscribeToTasks,
  updateTask,
} from '../queries';
import { useTaskFilterStore } from '../store';
import { groupTasksByDueDate, isSameDay, matchesTaskSearch } from '../task-view-utils';
import type { Task, TaskInput } from '../types';

export const taskQueryKeys = {
  all: ['tasks'] as const,
  list: (userId: string) => ['tasks', userId] as const,
};

/** Returns the cached task collection, using an empty array while it loads. */
export function useTasks(userId?: string) {
  const query = useQuery({
    queryKey: taskQueryKeys.list(userId ?? ''),
    queryFn: () => getTasks(userId as string),
    enabled: Boolean(userId),
    staleTime: Infinity,
  });
  return { ...query, data: query.data ?? [] };
}

/**
 * Connects the Firestore snapshot listener to TanStack Query. Components read
 * only from the cache and therefore do not need to manage subscriptions.
 */
export function useTaskRealtimeSync(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    return subscribeToTasks(
      userId,
      (tasks) => queryClient.setQueryData<Task[]>(taskQueryKeys.list(userId), tasks),
      () => void queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(userId) }),
    );
  }, [queryClient, userId]);
}

/** Selects one task from the already-synchronized user task collection. */
export function useTask(userId: string | undefined, taskId: string | undefined) {
  const query = useTasks(userId);
  return { ...query, data: query.data.find((task) => task.id === taskId) };
}

/** Exposes client-only filter state and actions from Zustand. */
export function useTaskFilters() {
  const priorityFilter = useTaskFilterStore((state) => state.priorityFilter);
  const statusFilter = useTaskFilterStore((state) => state.statusFilter);
  const searchQuery = useTaskFilterStore((state) => state.searchQuery);
  const setPriorityFilter = useTaskFilterStore((state) => state.setPriorityFilter);
  const setStatusFilter = useTaskFilterStore((state) => state.setStatusFilter);
  const setSearchQuery = useTaskFilterStore((state) => state.setSearchQuery);
  const resetFilters = useTaskFilterStore((state) => state.resetFilters);
  const resetViewState = useTaskFilterStore((state) => state.resetViewState);
  return {
    priorityFilter,
    statusFilter,
    searchQuery,
    setPriorityFilter,
    setStatusFilter,
    setSearchQuery,
    resetFilters,
    resetViewState,
  };
}

export function useTaskView() {
  const viewMode = useTaskFilterStore((state) => state.viewMode);
  const setViewMode = useTaskFilterStore((state) => state.setViewMode);
  return { viewMode, setViewMode };
}

/** Applies search, priority, and completion filters without changing server data. */
export function useVisibleTasks(userId?: string) {
  const query = useTasks(userId);
  const { priorityFilter, searchQuery, statusFilter } = useTaskFilters();
  const data = useMemo(
    () =>
      query.data.filter((task) => {
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'completed' ? task.isCompleted : !task.isCompleted);
        return matchesPriority && matchesStatus && matchesTaskSearch(task, searchQuery);
      }),
    [priorityFilter, query.data, searchQuery, statusFilter],
  );
  return { ...query, data };
}

/** Groups visible tasks into the date sections rendered by the dashboard. */
export function useTaskSections(userId?: string) {
  const query = useVisibleTasks(userId);
  const data = useMemo(() => groupTasksByDueDate(query.data), [query.data]);
  return { ...query, data };
}

/** Selects visible tasks for the active calendar day. */
export function useTasksForDate(userId: string | undefined, date: Date) {
  const query = useVisibleTasks(userId);
  const data = useMemo(
    () => query.data.filter((task) => isSameDay(task.dueDate, date)),
    [date, query.data],
  );
  return { ...query, data };
}

function useTaskMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<void>,
  getUserId: (variables: TVariables) => string,
) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn,
    onSuccess: (_data, variables) => {
      // The real-time listener normally supplies the change; invalidation is a safe fallback.
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.list(getUserId(variables)),
      });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? getTaskErrorMessage() : null,
  };
}

type CreateTaskVariables = { userId: string; input: TaskInput };
type UpdateTaskVariables = CreateTaskVariables & { taskId: string };
type TaskIdVariables = { userId: string; taskId: string };

export function useCreateTask() {
  return useTaskMutation(
    ({ userId, input }: CreateTaskVariables) => createTask(userId, input),
    ({ userId }) => userId,
  );
}

export function useUpdateTask() {
  return useTaskMutation(
    ({ userId, taskId, input }: UpdateTaskVariables) => updateTask(userId, taskId, input),
    ({ userId }) => userId,
  );
}

export function useDeleteTask() {
  return useTaskMutation(
    ({ userId, taskId }: TaskIdVariables) => deleteTask(userId, taskId),
    ({ userId }) => userId,
  );
}

export function useCompleteTask() {
  return useTaskMutation(
    ({ userId, taskId }: TaskIdVariables) => completeTask(userId, taskId),
    ({ userId }) => userId,
  );
}
