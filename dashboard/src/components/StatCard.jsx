import React from 'react';

function StatCard({ label, value, unit = '', status = 'ok' }) {
  const getStatusColor = () => {
    switch (status) {
      case 'warning': return 'var(--warning-color)';
      case 'critical': return 'var(--danger-color)';
      default: return 'var(--success-color)';
    }
  };

  return (
    <div className="card-panel interactive" style={{ flex: 1, minWidth: 160 }}>
      <div className="label-base">{label}</div>
      <div style={{ fontSize: 32, fontWeight: 600, color: getStatusColor(), marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {value ?? '—'}
        <span style={{ fontSize: 16 }}>{unit}</span>
      </div>
    </div>
  );
}

export default StatCard;
