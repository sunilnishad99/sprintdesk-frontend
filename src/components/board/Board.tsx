import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { TaskDrawer } from './TaskDrawer';
import { AddTaskModal } from './AddTaskModal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { useTasks, useUsers, useUpdateTask } from '../../hooks/useBoardQueries';
import { useBoardStore } from '../../store/boardStore';
import type { Task, TaskStatus } from '../../types/board';

const COLUMN_DEFS: { status: TaskStatus; title: string }[] = [
  { status: 'backlog', title: 'Backlog' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'review', title: 'Review' },
  { status: 'done', title: 'Done' },
];

const priorityFilterOptions = [
  { value: 'all', label: 'All priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function Board() {
  const { data: tasks = [], isLoading, isError } = useTasks();
  const { data: users = [] } = useUsers();
  const updateTask = useUpdateTask();

  const columns = useBoardStore((s) => s.columns);
  const hydrateFromTasks = useBoardStore((s) => s.hydrateFromTasks);
  const moveTask = useBoardStore((s) => s.moveTask);

  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Seed column order once tasks first arrive from the "server"
  useMemo(() => {
    if (tasks.length > 0) hydrateFromTasks(tasks);
  }, [tasks, hydrateFromTasks]);

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const passesFilters = (task: Task) => {
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (assigneeFilter !== 'all' && task.assigneeId !== Number(assigneeFilter)) return false;
    return true;
  };

  const filteredColumns = useMemo(() => {
    const result: Record<TaskStatus, number[]> = { backlog: [], 'in-progress': [], review: [], done: [] };
    COLUMN_DEFS.forEach(({ status }) => {
      result[status] = columns[status].filter((id) => {
        const task = tasksById.get(id);
        return task && passesFilters(task);
      });
    });
    return result;
  }, [columns, tasksById, priorityFilter, assigneeFilter]);

  const findColumnOfTask = (taskId: number): TaskStatus | undefined =>
    (Object.keys(columns) as TaskStatus[]).find((status) => columns[status].includes(taskId));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(Number(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);
    if (!over) return;

    const taskId = Number(active.id);
    const fromStatus = findColumnOfTask(taskId);
    if (!fromStatus) return;

    // `over.id` is either another task's id (dropped on a card) or a column
    // status (dropped on empty column space)
    const overId = over.id;
    const isOverColumn = COLUMN_DEFS.some((c) => c.status === overId);
    const toStatus: TaskStatus = isOverColumn
      ? (overId as TaskStatus)
      : (findColumnOfTask(Number(overId)) ?? fromStatus);

    const toIndex = isOverColumn
      ? columns[toStatus].length
      : columns[toStatus].indexOf(Number(overId));

    if (fromStatus === toStatus && toIndex === columns[fromStatus].indexOf(taskId)) return;

    moveTask({ taskId, fromStatus, toStatus, toIndex: toIndex < 0 ? 0 : toIndex });

    // Persist the status change server-side when a task crosses columns
    if (fromStatus !== toStatus) {
      updateTask.mutate({ id: taskId, changes: { status: toStatus } });
    }
  };

  const selectedTask = selectedTaskId ? (tasksById.get(selectedTaskId) ?? null) : null;
  const activeTask = activeTaskId ? tasksById.get(activeTaskId) : null;
  const activeSprintId = tasks[0]?.sprintId ?? 3;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex gap-4">
          {COLUMN_DEFS.map((c) => (
            <div key={c.status} className="h-96 w-72 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Failed to load tasks. Please try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">Sprint Board</h1>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Select
              label="Priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={priorityFilterOptions}
            />
          </div>
          <div className="w-48">
            <Select
              label="Assignee"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              options={[{ value: 'all', label: 'All assignees' }, ...users.map((u) => ({ value: u.id, label: u.name }))]}
            />
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>+ Add Task</Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMN_DEFS.map(({ status, title }) => (
            <Column
              key={status}
              status={status}
              title={title}
              taskIds={filteredColumns[status]}
              tasksById={tasksById}
              usersById={usersById}
              onTaskClick={setSelectedTaskId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} assignee={usersById.get(activeTask.assigneeId)} onClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDrawer task={selectedTask} users={users} onClose={() => setSelectedTaskId(null)} />

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        users={users}
        activeSprintId={activeSprintId}
      />
    </div>
  );
}
