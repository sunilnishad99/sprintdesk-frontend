import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { StatusDatum } from '../../utils/analytics';

const STATUS_COLORS: Record<string, string> = {
  backlog: '#9ca3af',
  'in-progress': '#3b82f6',
  review: '#f59e0b',
  done: '#10b981',
};

export function TaskStatusChart({ data }: { data: StatusDatum[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Task Status Distribution</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={80}
            animationDuration={600}
                        label={(entry: unknown) => {
              const d = entry as StatusDatum;
              return `${d.label}: ${d.count}`;
            }}
          >
            {data.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
