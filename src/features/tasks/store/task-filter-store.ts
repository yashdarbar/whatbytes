import { create } from 'zustand';

import type { TaskPriorityFilter, TaskStatusFilter, TaskViewMode } from '../types';

type TaskFilterState = {
  priorityFilter: TaskPriorityFilter;
  statusFilter: TaskStatusFilter;
  searchQuery: string;
  viewMode: TaskViewMode;
  setPriorityFilter: (filter: TaskPriorityFilter) => void;
  setStatusFilter: (filter: TaskStatusFilter) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: TaskViewMode) => void;
  resetFilters: () => void;
  resetViewState: () => void;
};

export const useTaskFilterStore = create<TaskFilterState>((set) => ({
  priorityFilter: 'all',
  statusFilter: 'all',
  searchQuery: '',
  viewMode: 'list',
  setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setViewMode: (viewMode) => set({ viewMode }),
  resetFilters: () => set({ priorityFilter: 'all', statusFilter: 'all' }),
  resetViewState: () =>
    set({ priorityFilter: 'all', statusFilter: 'all', searchQuery: '', viewMode: 'list' }),
}));
