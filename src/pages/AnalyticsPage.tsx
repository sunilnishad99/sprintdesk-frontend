import { useMemo } from 'react';
import { useSprints, useTasks } from '../hooks/useBoardQueries';
import { SprintVelocityChart } from '../components/analytics/SprintVelocityChart';
import { TaskStatusChart } from '../components/analytics/TaskStatusChart';
import { PriorityBreakdownChart } from '../components/analytics/PriorityBreakdownChart';
import { CompletionTrendChart } from '../components/analytics/CompletionTrendChart';
import {
  getCompletionTrend,
  getPriorityByStatus,
  getSprintVelocity,
  getStatusDistribution,
} from '../utils/analytics';

export default function AnalyticsPage() {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: sprints = [], isLoading: sprintsLoading } = useSprints();

  // Charts re-derive automatically whenever `tasks` changes (task added,
  // deleted, or moved between columns) because they're plain memoized
  // functions of the TanStack Query cache — no separate analytics state.
  const velocity = useMemo(() => getSprintVelocity(tasks, sprints), [tasks, sprints]);
  const statusDistribution = useMemo(() => getStatusDistribution(tasks), [tasks]);
  const priorityByStatus = useMemo(() => getPriorityByStatus(tasks), [tasks]);
  const completionTrend = useMemo(() => getCompletionTrend(tasks), [tasks]);

  const isLoading = tasksLoading || sprintsLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Analytics</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SprintVelocityChart data={velocity} />
        <TaskStatusChart data={statusDistribution} />
        <PriorityBreakdownChart data={priorityByStatus} />
        <CompletionTrendChart data={completionTrend} />
      </div>
    </div>
  );
}
