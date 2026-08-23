import { useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useCreateTask } from '../../hooks/useBoardQueries';
import { useBoardStore } from '../../store/boardStore';
import { useToast } from '../../hooks/useToast';
import type { NewTaskInput, TaskPriority, User } from '../../types/board';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  activeSprintId: number;
}

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function AddTaskModal({ isOpen, onClose, users, activeSprintId }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<number>(users[0]?.id ?? 1);
  const [dueDate, setDueDate] = useState('');

  const createTask = useCreateTask();
  const addTaskToColumn = useBoardStore((s) => s.addTaskToColumn);
  const { toast } = useToast();

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setAssigneeId(users[0]?.id ?? 1);
    setDueDate('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const input: NewTaskInput = {
      title: title.trim(),
      description: description.trim(),
      priority,
      assigneeId: Number(assigneeId),
      dueDate,
      sprintId: activeSprintId,
    };

    createTask.mutate(input, {
      onSuccess: (newTask) => {
        addTaskToColumn(newTask.id, 'backlog');
        toast.success(`"${newTask.title}" added to Backlog`);
        resetForm();
        onClose();
      },
      onError: () => {
        toast.error('Failed to create task. Please try again.');
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Task">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="task-description" className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
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

        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createTask.isPending}>
            Add Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
