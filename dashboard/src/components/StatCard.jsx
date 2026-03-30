import React from 'react';

// A simple KPI card shown at the top of the dashboard
// value: the number to display
// label: e.g. "CPU Usage"
// unit:  e.g. "%" or "MB"
// status: "ok" | "warning" | "critical"
function StatCard({ label, value, unit = '', status = 'ok' }) {
  const colors = {
    ok:       { bg: '#e8f5e9', text: '#2e7d32' },
    warning:  { bg: '#fff8e1', text: '#f57f17' },
    critical: { bg: '#ffebee', text: '#c62828' },
  };
  const { bg, text } = colors[status] || colors.ok;

  return (
    <div style={{
      background: bg,
      borderRadius: 12,
      padding: '20px 24px',
      minWidth: 160,
      flex: 1,
    }}>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 600, color: text }}>
        {value ?? '—'}<span style={{ fontSize: 16 }}>{unit}</span>
      </div>
    </div>
  );
}

export default StatCard;
