import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, User } from '../../types/board';

interface TaskCardProps {
  task: Task;
  assignee?: User;
  onClick: () => void;
}

const priorityClasses: Record<Task['priority'], string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export function TaskCard({ task, assignee, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none' as const,
  };

  const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className="cursor-grab rounded-md border border-gray-200 bg-white p-3 shadow-sm
        transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2
        focus-visible:outline-indigo-500 active:cursor-grabbing
        dark:border-gray-700 dark:bg-gray-800"
    >
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${priorityClasses[task.priority]}`}
        >
          {task.priority}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{dueDate}</span>
      </div>

      {assignee && (
        <div className="mt-3 flex items-center gap-2">
          <img src={assignee.avatar} alt={assignee.name} className="h-6 w-6 rounded-full" />
          <span className="text-xs text-gray-600 dark:text-gray-300">{assignee.name}</span>
        </div>
      )}
    </div>
  );
}
