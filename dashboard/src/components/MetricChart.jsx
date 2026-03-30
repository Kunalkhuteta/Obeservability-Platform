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
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, color: '#111' }}>{title || name}</h3>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          style={{ fontSize: 12, border: '1px solid #ddd', borderRadius: 6, padding: '2px 8px' }}
        >
          <option value="15m">15 min</option>
          <option value="1h">1 hour</option>
          <option value="6h">6 hours</option>
          <option value="24h">24 hours</option>
        </select>
      </div>

      {loading && <div style={{ color: '#999', fontSize: 13 }}>Loading...</div>}
      {error   && <div style={{ color: 'red',  fontSize: 13 }}>{error}</div>}

      {!loading && !error && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
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
