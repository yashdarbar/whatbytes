export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatusFilter = 'all' | 'completed' | 'incomplete';
export type TaskPriorityFilter = 'all' | TaskPriority;
export type TaskViewMode = 'list' | 'calendar';

export type Task = {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: TaskPriority;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskInput = Pick<Task, 'title' | 'description' | 'dueDate' | 'priority'>;

export type TaskFormErrors = Partial<Record<'title' | 'dueDate', string>>;

export type TaskSectionKey = 'overdue' | 'today' | 'tomorrow' | 'this-week' | 'later';

export type TaskSection = {
  key: TaskSectionKey;
  title: string;
  data: Task[];
};
