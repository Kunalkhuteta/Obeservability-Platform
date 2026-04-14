import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useMetricSeries } from '../hooks/useMetrics';

// Renders a time-series line chart for any metric
// name:  metric name, e.g. "cpu_usage"
// color: line color
function MetricChart({ name, color = '#4f46e5', title }) {
  const [range, setRange] = useState('1h');
  const { data, loading, error } = useMetricSeries(name, range);

  const formatted = data.map((p) => ({
    ...p,
    time: new Date(p.time).toLocaleTimeString(),
  }));

  return (
    <div className="card chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
        <div className="card-title">{title || name}</div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="input-base"
          style={{ width: 'auto', fontSize: 12, padding: '4px 30px 4px 10px' }}
        >
          <option value="15m">15 min</option>
          <option value="1h">1 hour</option>
          <option value="6h">6 hours</option>
          <option value="24h">24 hours</option>
        </select>
      </div>

      {loading && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading...</div>}
      {error   && <div style={{ color: 'var(--danger-color)',  fontSize: 13 }}>{error}</div>}

      {!loading && !error && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: 8 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default MetricChart;
