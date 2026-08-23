import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus, User } from '../../types/board';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  status: TaskStatus;
  title: string;
  taskIds: number[];
  tasksById: Map<number, Task>;
  usersById: Map<number, User>;
  onTaskClick: (taskId: number) => void;
}

const columnAccent: Record<TaskStatus, string> = {
  backlog: 'border-t-gray-400',
  'in-progress': 'border-t-blue-500',
  review: 'border-t-amber-500',
  done: 'border-t-emerald-500',
};

export function Column({ status, title, taskIds, tasksById, usersById, onTaskClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-full min-w-0 flex-col">
      <div
        className={`flex items-center justify-between border-t-4 ${columnAccent[status]}
          rounded-t-md bg-gray-100 px-3 py-2 dark:bg-gray-800`}
      >
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500
          dark:bg-gray-700 dark:text-gray-300">
          {taskIds.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 rounded-b-md border border-t-0 p-2
          ${isOver
            ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40'
            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'}`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {taskIds.map((id) => {
            const task = tasksById.get(id);
            if (!task) return null;
            return (
              <TaskCard
                key={id}
                task={task}
                assignee={usersById.get(task.assigneeId)}
                onClick={() => onTaskClick(id)}
              />
            );
          })}
        </SortableContext>

        {taskIds.length === 0 && (
          <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">No tasks</p>
        )}
      </div>
    </div>
  );
}
