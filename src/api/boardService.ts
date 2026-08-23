import mockData from '../data/mock-data.json';
import type { Task, User, Sprint, Comment, NewTaskInput } from '../types/board';

// Everything that touches mock-data.json lives HERE. Components never import
// the JSON directly. When a real backend is ready, only this file changes —
// swap each function's body for a real fetch() call, keep the signatures.

const SIMULATED_DELAY_MS = 300;
const delay = (ms = SIMULATED_DELAY_MS) => new Promise((r) => setTimeout(r, ms));

// In-memory mutable copy so add/update/delete persist for the session
// (Zustand + localStorage is the real persistence layer on top of this).
let tasks: Task[] = [...(mockData.tasks as Task[])];
let comments: Comment[] = [...(mockData.comments as Comment[])];
let nextTaskId = Math.max(...tasks.map((t) => t.id)) + 1;
let nextCommentId = Math.max(...comments.map((c) => c.id)) + 1;

export const boardService = {
  getUsers: async (): Promise<User[]> => {
    await delay();
    return mockData.users as User[];
  },

  getSprints: async (): Promise<Sprint[]> => {
    await delay();
    return mockData.sprints as Sprint[];
  },

  // "Fetch the first 30 tasks" per the assignment
   // Mock dataset itself is exactly 30 tasks — "fetch the first 30" is
  // satisfied by the initial load. We return the full working set (not a
  // slice) so tasks created afterward via "+ Add Task" remain visible too.
  getTasks: async (): Promise<Task[]> => {
    await delay();
    return tasks;
  },
  getComments: async (taskId: number): Promise<Comment[]> => {
    await delay(150);
    return comments.filter((c) => c.taskId === taskId);
  },

  createTask: async (input: NewTaskInput): Promise<Task> => {
    await delay();
    const now = new Date().toISOString();
    const newTask: Task = {
      id: nextTaskId++,
      title: input.title,
      description: input.description,
      status: 'backlog',
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      sprintId: input.sprintId,
      order: tasks.filter((t) => t.status === 'backlog').length + 1,
      createdAt: now,
      completedAt: null,
      updatedAt: now,
    };
    tasks = [...tasks, newTask];
    return newTask;
  },

  updateTask: async (id: number, changes: Partial<Task>): Promise<Task> => {
    await delay(150);
    const now = new Date().toISOString();
    let updated: Task | undefined;
    tasks = tasks.map((t) => {
      if (t.id !== id) return t;
      updated = {
        ...t,
        ...changes,
        updatedAt: now,
        completedAt: changes.status === 'done' ? now : t.completedAt,
      };
      return updated;
    });
    if (!updated) throw new Error(`Task ${id} not found`);
    return updated;
  },

  deleteTask: async (id: number): Promise<void> => {
    await delay(150);
    tasks = tasks.filter((t) => t.id !== id);
  },

  addComment: async (taskId: number, authorId: number, message: string): Promise<Comment> => {
    await delay(150);
    const comment: Comment = {
      id: nextCommentId++,
      taskId,
      authorId,
      message,
      createdAt: new Date().toISOString(),
    };
    comments = [...comments, comment];
    return comment;
  },
};
