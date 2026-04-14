import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

function StatCard({ label, value, unit = '', status = 'ok' }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'warning': return { color: 'var(--warning-color)', Icon: AlertTriangle };
      case 'critical': return { color: 'var(--danger-color)', Icon: AlertCircle };
      default: return { color: 'var(--success-color)', Icon: CheckCircle2 };
    }
  };

  const { color, Icon } = getStatusConfig();

  return (
    <div className={`stat-card ${status}`}>
      <div className="stat-emoji">
        <Icon size={24} color={color} strokeWidth={2.5} />
      </div>
      <div className="stat-info">
        <div className="stat-value">
          {value ?? '—'}
          {unit && <span className="stat-unit">{unit}</span>}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default StatCard;
