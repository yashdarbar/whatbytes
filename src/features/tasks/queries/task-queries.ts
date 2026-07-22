import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import type { Task, TaskInput } from '../types';
import { firestore } from '@/lib/firebase';

function timestampToDate(value: unknown): Date {
  return value instanceof Timestamp ? value.toDate() : new Date();
}

function mapTask(snapshot: QueryDocumentSnapshot<DocumentData>): Task {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: String(data.userId),
    title: String(data.title),
    description: String(data.description ?? ''),
    dueDate: timestampToDate(data.dueDate),
    priority: data.priority as Task['priority'],
    isCompleted: Boolean(data.isCompleted),
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

function createTasksQuery(userId: string) {
  return query(collection(firestore, 'users', userId, 'tasks'), orderBy('dueDate', 'asc'));
}

export async function getTasks(userId: string): Promise<Task[]> {
  const snapshot = await getDocs(createTasksQuery(userId));
  return snapshot.docs.map(mapTask);
}

export function subscribeToTasks(
  userId: string,
  onTasks: (tasks: Task[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    createTasksQuery(userId),
    (snapshot) => onTasks(snapshot.docs.map(mapTask)),
    onError,
  );
}

export async function createTask(userId: string, input: TaskInput): Promise<void> {
  await addDoc(collection(firestore, 'users', userId, 'tasks'), {
    userId,
    title: input.title.trim(),
    description: input.description.trim(),
    dueDate: Timestamp.fromDate(input.dueDate),
    priority: input.priority,
    isCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTask(userId: string, taskId: string, input: TaskInput): Promise<void> {
  await updateDoc(doc(firestore, 'users', userId, 'tasks', taskId), {
    title: input.title.trim(),
    description: input.description.trim(),
    dueDate: Timestamp.fromDate(input.dueDate),
    priority: input.priority,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  await deleteDoc(doc(firestore, 'users', userId, 'tasks', taskId));
}

export async function completeTask(userId: string, taskId: string): Promise<void> {
  await updateDoc(doc(firestore, 'users', userId, 'tasks', taskId), {
    isCompleted: true,
    updatedAt: serverTimestamp(),
  });
}

export function getTaskErrorMessage(): string {
  return 'Unable to update your tasks. Check your connection and try again.';
}
