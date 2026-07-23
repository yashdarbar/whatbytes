import type { TaskFormErrors, TaskInput } from './types';

/** Validates task input before a Firebase mutation is attempted. */
export function validateTask(input: TaskInput): TaskFormErrors {
  const errors: TaskFormErrors = {};
  if (!input.title.trim()) errors.title = 'Title is required.';
  if (Number.isNaN(input.dueDate.getTime())) errors.dueDate = 'Choose a valid due date.';
  return errors;
}
