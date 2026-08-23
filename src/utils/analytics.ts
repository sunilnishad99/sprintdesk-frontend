import type { Sprint, Task, TaskPriority, TaskStatus } from '../types/board';

export interface VelocityDatum {
  sprintName: string;
  completed: number;
}

export interface StatusDatum {
  status: TaskStatus;
  label: string;
  count: number;
}

export interface PriorityByStatusDatum {
  status: string;
  low: number;
  medium: number;
  high: number;
}

export interface TrendDatum {
  date: string; // formatted for display
  cumulativeCompleted: number;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
};

// Sprint Velocity — number of completed tasks per sprint
export function getSprintVelocity(tasks: Task[], sprints: Sprint[]): VelocityDatum[] {
  return sprints.map((sprint) => ({
    sprintName: sprint.name,
    completed: tasks.filter((t) => t.sprintId === sprint.id && t.status === 'done').length,
  }));
}

// Task Status — distribution across board columns
export function getStatusDistribution(tasks: Task[]): StatusDatum[] {
  const statuses: TaskStatus[] = ['backlog', 'in-progress', 'review', 'done'];
  return statuses.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: tasks.filter((t) => t.status === status).length,
  }));
}

// Priority Breakdown — task priorities across columns (stacked bar friendly shape)
export function getPriorityByStatus(tasks: Task[]): PriorityByStatusDatum[] {
  const statuses: TaskStatus[] = ['backlog', 'in-progress', 'review', 'done'];
  return statuses.map((status) => {
    const inStatus = tasks.filter((t) => t.status === status);
    const countFor = (p: TaskPriority) => inStatus.filter((t) => t.priority === p).length;
    return {
      status: STATUS_LABELS[status],
      low: countFor('low'),
      medium: countFor('medium'),
      high: countFor('high'),
    };
  });
}

// Completion Trend — cumulative tasks completed over time
export function getCompletionTrend(tasks: Task[]): TrendDatum[] {
  const completed = tasks
    .filter((t) => t.completedAt)
    .map((t) => new Date(t.completedAt as string))
    .sort((a, b) => a.getTime() - b.getTime());

  const byDay = new Map<string, number>();
  completed.forEach((date) => {
    const key = date.toISOString().slice(0, 10); // YYYY-MM-DD
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  });

  const sortedDays = Array.from(byDay.keys()).sort();
  let cumulative = 0;
  return sortedDays.map((day) => {
    cumulative += byDay.get(day) as number;
    return {
      date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cumulativeCompleted: cumulative,
    };
  });
}
