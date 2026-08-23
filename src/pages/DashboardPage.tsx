import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTasks, useUsers } from '../hooks/useBoardQueries';
import { DataTable, type Column } from '../components/ui/DataTable';
import type { Task } from '../types/board';

const statusLabels: Record<Task['status'], string> = {
  backlog: 'Backlog',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: users = [] } = useUsers();

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const summary = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'done').length;
    const overdue = tasks.filter(
      (t) => t.status !== 'done' && new Date(t.dueDate) < new Date(),
    ).length;
    return { total: tasks.length, done, overdue };
  }, [tasks]);

  const columns: Column<Task>[] = [
    { key: 'title', header: 'Task', sortable: true },
    { key: 'status', header: 'Status', sortable: true, render: (row) => statusLabels[row.status] },
    { key: 'priority', header: 'Priority', sortable: true },
    {
      key: 'assigneeId',
      header: 'Assignee',
      render: (row) => usersById.get(row.assigneeId)?.name ?? 'Unassigned',
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (row) => new Date(row.dueDate).toLocaleDateString(),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Welcome{user ? `, ${user.firstName}` : ''} 👋
      </h1>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Tasks</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.total}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{summary.done}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
          <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">{summary.overdue}</p>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">All Sprint Tasks</h2>
      <DataTable columns={columns} data={tasks} isLoading={tasksLoading} caption="Sprint task summary" />
    </div>
  );
}
