import type { Task, TaskSection, TaskSectionKey } from './types';

export function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function isSameDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function matchesTaskSearch(task: Task, query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return `${task.title} ${task.description}`.toLocaleLowerCase().includes(normalized);
}

export function groupTasksByDueDate(tasks: Task[], now = new Date()): TaskSection[] {
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + ((7 - today.getDay()) % 7));

  const groups: Record<TaskSectionKey, Task[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    'this-week': [],
    later: [],
  };

  [...tasks]
    .sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime())
    .forEach((task) => {
      const dueDate = startOfDay(task.dueDate);
      if (dueDate < today) groups.overdue.push(task);
      else if (dueDate.getTime() === today.getTime()) groups.today.push(task);
      else if (dueDate.getTime() === tomorrow.getTime()) groups.tomorrow.push(task);
      else if (dueDate <= endOfWeek) groups['this-week'].push(task);
      else groups.later.push(task);
    });

  const labels: Record<TaskSectionKey, string> = {
    overdue: 'Overdue',
    today: 'Today',
    tomorrow: 'Tomorrow',
    'this-week': 'This week',
    later: 'Later',
  };

  return (Object.keys(groups) as TaskSectionKey[])
    .filter((key) => groups[key].length > 0)
    .map((key) => ({ key, title: labels[key], data: groups[key] }));
}
