import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus } from '../types/board';

// --- Why this store exists ---
// Task CONTENT (title, priority, assignee...) is server state → TanStack Query.
// Task ORDER within/across columns is a pure UI/client concern (the backend
// mock doesn't really support persisted drag order) → Zustand, persisted to
// localStorage so a refresh doesn't reset your board layout.

export type ColumnMap = Record<TaskStatus, number[]>; // status -> ordered task IDs

const emptyColumns: ColumnMap = {
  backlog: [],
  'in-progress': [],
  review: [],
  done: [],
};

interface BoardState {
  columns: ColumnMap;
  isHydratedFromServer: boolean;

  // Called once when server tasks first load, to seed column order.
  hydrateFromTasks: (tasks: Task[]) => void;

  // Called whenever a task is created/deleted server-side, to keep columns in sync.
  addTaskToColumn: (taskId: number, status: TaskStatus) => void;
  removeTaskFromColumn: (taskId: number) => void;

  // Drag-and-drop reordering
  moveTask: (params: {
    taskId: number;
    fromStatus: TaskStatus;
    toStatus: TaskStatus;
    toIndex: number;
  }) => void;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      columns: emptyColumns,
      isHydratedFromServer: false,

      hydrateFromTasks: (tasks) => {
        // Only seed from server once — after that, the persisted local order wins,
        // so a user's drag-and-drop arrangement survives refreshes.
        if (get().isHydratedFromServer) return;

        const columns: ColumnMap = { backlog: [], 'in-progress': [], review: [], done: [] };
        [...tasks]
          .sort((a, b) => a.order - b.order)
          .forEach((t) => columns[t.status].push(t.id));

        set({ columns, isHydratedFromServer: true });
      },

      addTaskToColumn: (taskId, status) =>
        set((state) => ({
          columns: { ...state.columns, [status]: [...state.columns[status], taskId] },
        })),

      removeTaskFromColumn: (taskId) =>
        set((state) => {
          const columns = { ...state.columns };
          (Object.keys(columns) as TaskStatus[]).forEach((status) => {
            columns[status] = columns[status].filter((id) => id !== taskId);
          });
          return { columns };
        }),

      moveTask: ({ taskId, fromStatus, toStatus, toIndex }) =>
        set((state) => {
          const columns = { ...state.columns };
          columns[fromStatus] = columns[fromStatus].filter((id) => id !== taskId);
          const target = [...columns[toStatus]];
          target.splice(toIndex, 0, taskId);
          columns[toStatus] = target;
          return { columns };
        }),
    }),
    {
      name: 'sprintdesk_board_columns', // localStorage key
    },
  ),
);
