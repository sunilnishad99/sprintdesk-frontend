import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardStore } from './boardStore';
import type { Task } from '../types/board';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 1,
  title: 'Sample task',
  description: '',
  status: 'backlog',
  priority: 'medium',
  assigneeId: 1,
  dueDate: '2026-01-01',
  sprintId: 1,
  order: 1,
  createdAt: '2026-01-01T00:00:00Z',
  completedAt: null,
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('useBoardStore', () => {
  beforeEach(() => {
    // Reset to a clean slate before every test — this store is a
    // module-level singleton, so state would otherwise leak between tests.
    useBoardStore.setState({
      columns: { backlog: [], 'in-progress': [], review: [], done: [] },
      isHydratedFromServer: false,
    });
  });

  describe('hydrateFromTasks', () => {
    it('distributes tasks into columns by status, ordered by `order`', () => {
      const tasks = [
        makeTask({ id: 1, status: 'backlog', order: 2 }),
        makeTask({ id: 2, status: 'backlog', order: 1 }),
        makeTask({ id: 3, status: 'done', order: 1 }),
      ];

      useBoardStore.getState().hydrateFromTasks(tasks);

      const { columns } = useBoardStore.getState();
      expect(columns.backlog).toEqual([2, 1]); // id 2 has order 1, comes first
      expect(columns.done).toEqual([3]);
    });

    it('only hydrates once — a second call does not overwrite existing column order', () => {
      const initial = [makeTask({ id: 1, status: 'backlog', order: 1 })];
      useBoardStore.getState().hydrateFromTasks(initial);

      // Simulate the person having since dragged task 1 into "done"
      useBoardStore.setState({ columns: { backlog: [], 'in-progress': [], review: [], done: [1] } });

      // A re-fetch of the same tasks (e.g. after a refresh) should NOT reset the drag
      useBoardStore.getState().hydrateFromTasks(initial);

      expect(useBoardStore.getState().columns.done).toEqual([1]);
      expect(useBoardStore.getState().columns.backlog).toEqual([]);
    });
  });

  describe('addTaskToColumn (add)', () => {
    it('appends a task id to the target column', () => {
      useBoardStore.getState().addTaskToColumn(42, 'backlog');
      expect(useBoardStore.getState().columns.backlog).toEqual([42]);
    });

    it('appends after existing tasks rather than replacing them', () => {
      useBoardStore.setState({
        columns: { backlog: [1, 2], 'in-progress': [], review: [], done: [] },
      });
      useBoardStore.getState().addTaskToColumn(3, 'backlog');
      expect(useBoardStore.getState().columns.backlog).toEqual([1, 2, 3]);
    });
  });

  describe('moveTask (move / reorder)', () => {
    beforeEach(() => {
      useBoardStore.setState({
        columns: { backlog: [1, 2, 3], 'in-progress': [], review: [], done: [] },
      });
    });

    it('reorders a task within the same column', () => {
      useBoardStore.getState().moveTask({ taskId: 1, fromStatus: 'backlog', toStatus: 'backlog', toIndex: 2 });
      expect(useBoardStore.getState().columns.backlog).toEqual([2, 3, 1]);
    });

    it('moves a task across columns, removing it from the source', () => {
      useBoardStore.getState().moveTask({ taskId: 2, fromStatus: 'backlog', toStatus: 'in-progress', toIndex: 0 });

      const { columns } = useBoardStore.getState();
      expect(columns.backlog).toEqual([1, 3]);
      expect(columns['in-progress']).toEqual([2]);
    });

    it('inserts at the requested index in the destination column', () => {
      useBoardStore.setState({
        columns: { backlog: [1], 'in-progress': [10, 20], review: [], done: [] },
      });
      useBoardStore.getState().moveTask({ taskId: 1, fromStatus: 'backlog', toStatus: 'in-progress', toIndex: 1 });

      expect(useBoardStore.getState().columns['in-progress']).toEqual([10, 1, 20]);
    });
  });

  describe('removeTaskFromColumn (delete)', () => {
    it('removes a task id from whichever column contains it', () => {
      useBoardStore.setState({
        columns: { backlog: [1, 2], 'in-progress': [3], review: [], done: [] },
      });

      useBoardStore.getState().removeTaskFromColumn(2);

      const { columns } = useBoardStore.getState();
      expect(columns.backlog).toEqual([1]);
      expect(columns['in-progress']).toEqual([3]); // untouched
    });

    it('is a no-op if the task id is not present anywhere', () => {
      useBoardStore.setState({
        columns: { backlog: [1], 'in-progress': [], review: [], done: [] },
      });

      expect(() => useBoardStore.getState().removeTaskFromColumn(999)).not.toThrow();
      expect(useBoardStore.getState().columns.backlog).toEqual([1]);
    });
  });
});
