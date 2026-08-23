import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PriorityByStatusDatum } from '../../utils/analytics';

export function PriorityBreakdownChart({ data }: { data: PriorityByStatusDatum[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Priority Breakdown by Column</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="status" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="low" stackId="priority" fill="#10b981" name="Low" animationDuration={600} />
          <Bar dataKey="medium" stackId="priority" fill="#f59e0b" name="Medium" animationDuration={600} />
          <Bar dataKey="high" stackId="priority" fill="#ef4444" name="High" radius={[4, 4, 0, 0]} animationDuration={600} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
