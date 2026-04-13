import React from 'react';

// Shows severity as a colored badge
function SeverityBadge({ severity }) {
  const isCritical = severity === 'critical';
  return (
    <span className={`status-badge ${isCritical ? 'critical' : 'warning'}`}>
      {severity}
    </span>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
        background: enabled ? 'var(--accent-color)' : 'var(--border-color)',
        position: 'relative', transition: 'var(--transition)',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3, left: enabled ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: 'var(--bg-card)', transition: 'var(--transition)',
        boxShadow: 'var(--shadow-sm)'
      }} />
    </div>
  );
}

// Condition symbols — "gt" becomes ">", "lt" becomes "<"
function formatCondition(condition, threshold) {
  const symbols = { gt: '>', lt: '<', eq: '=' };
  return `${symbols[condition] || condition} ${threshold}`;
}

// Main table component
// rules:    array of alert rule objects from the API
// onToggle: called when user flips the enable/disable switch
function AlertsTable({ rules, onToggle }) {
  if (!rules || rules.length === 0) {
    return (
      <div style={{ color: '#999', fontSize: 14, padding: '20px 0' }}>
        No alert rules yet. Create one above.
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {['Name', 'Metric', 'Condition', 'Duration', 'Severity', 'Enabled'].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr
              key={rule.id}
              style={{
                opacity: rule.enabled ? 1 : 0.5,
              }}
            >
              <td style={{ fontWeight: 500 }}>{rule.name}</td>
              <td style={{ fontFamily: 'monospace', color: 'var(--accent-color)' }}>
                {rule.metric}
              </td>
              <td style={{ fontFamily: 'monospace' }}>
                {formatCondition(rule.condition, rule.threshold)}
              </td>
              <td style={{ color: 'var(--text-secondary)' }}>
                {rule.duration_s}s
              </td>
              <td>
                <SeverityBadge severity={rule.severity} />
              </td>
              <td>
                <Toggle
                  enabled={rule.enabled}
                  onChange={() => onToggle(rule.id, !rule.enabled)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AlertsTable;
