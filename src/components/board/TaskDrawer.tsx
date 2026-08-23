import { useEffect, useState, type FormEvent } from 'react';
import type { Task, TaskPriority, User } from '../../types/board';
import { useComments, useAddComment, useUpdateTask, useDeleteTask } from '../../hooks/useBoardQueries';
import { useBoardStore } from '../../store/boardStore';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface TaskDrawerProps {
  task: Task | null;
  users: User[];
  onClose: () => void;
}

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function TaskDrawer({ task, users, onClose }: TaskDrawerProps) {
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<number>(1);
  const [newComment, setNewComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: comments = [] } = useComments(task?.id ?? null);
  const addComment = useAddComment();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const removeTaskFromColumn = useBoardStore((s) => s.removeTaskFromColumn);

  useEffect(() => {
    if (task) {
      setDescription(task.description);
      setPriority(task.priority);
      setAssigneeId(task.assigneeId);
    }
  }, [task]);

  if (!task) return null;

  const usersById = new Map(users.map((u) => [u.id, u]));

  const handleSaveEdits = () => {
    updateTask.mutate({ id: task.id, changes: { description, priority, assigneeId } });
  };

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    // authorId hardcoded to first user for demo purposes — in a real app this
    // would come from the authenticated user's session.
    addComment.mutate(
      { taskId: task.id, authorId: users[0]?.id ?? 1, message: newComment.trim() },
      { onSuccess: () => setNewComment('') },
    );
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        removeTaskFromColumn(task.id);
        setShowDeleteConfirm(false);
        onClose();
      },
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label={`Task details: ${task.title}`}
          className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-6 shadow-xl"
        >
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
            <button
              onClick={onClose}
              aria-label="Close task details"
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <p className="mt-1 text-xs uppercase tracking-wide text-gray-400">
            Status: {task.status.replace('-', ' ')}
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="drawer-description" className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="drawer-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              options={priorityOptions}
            />

            <Select
              label="Assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(Number(e.target.value))}
              options={users.map((u) => ({ value: u.id, label: u.name }))}
            />

            <p className="text-sm text-gray-500">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </p>

            <div className="flex gap-2">
              <Button onClick={handleSaveEdits} isLoading={updateTask.isPending} size="sm">
                Save changes
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                Delete task
              </Button>
            </div>
          </div>

          <hr className="my-6 border-gray-200" />

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Comments ({comments.length})
            </h3>

            <div className="flex flex-col gap-3">
              {comments.map((c) => {
                const author = usersById.get(c.authorId);
                return (
                  <div key={c.id} className="flex gap-2">
                    {author && (
                      <img src={author.avatar} alt={author.name} className="h-7 w-7 rounded-full" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-gray-900">{author?.name ?? 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{c.message}</p>
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 && (
                <p className="text-sm text-gray-400">No comments yet.</p>
              )}
            </div>

            <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment…"
                aria-label="Write a comment"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button type="submit" size="sm" isLoading={addComment.isPending}>
                Post
              </Button>
            </form>
          </div>
        </aside>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        taskTitle={task.title}
        isDeleting={deleteTask.isPending}
      />
    </>
  );
}
