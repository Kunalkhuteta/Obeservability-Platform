import React from 'react';

// Shows severity as a colored badge
function SeverityBadge({ severity }) {
  const colors = {
    critical: { bg: '#ffebee', text: '#c62828' },
    warning:  { bg: '#fff8e1', text: '#f57f17' },
  };
  const c = colors[severity] || colors.warning;
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
    }}>
      {severity}
    </span>
  );
}

// Toggle switch component
function Toggle({ enabled, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
        background: enabled ? '#4f46e5' : '#d1d5db',
        position: 'relative', transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3, left: enabled ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
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
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
            {['Name', 'Metric', 'Condition', 'Duration', 'Severity', 'Enabled'].map((h) => (
              <th key={h} style={{
                textAlign: 'left', padding: '10px 16px',
                fontSize: 12, color: '#666', fontWeight: 500,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr
              key={rule.id}
              style={{
                borderBottom: '1px solid #f9f9f9',
                opacity: rule.enabled ? 1 : 0.5,
              }}
            >
              <td style={{ padding: '12px 16px', fontWeight: 500 }}>{rule.name}</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#4f46e5' }}>
                {rule.metric}
              </td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>
                {formatCondition(rule.condition, rule.threshold)}
              </td>
              <td style={{ padding: '12px 16px', color: '#666' }}>
                {rule.duration_s}s
              </td>
              <td style={{ padding: '12px 16px' }}>
                <SeverityBadge severity={rule.severity} />
              </td>
              <td style={{ padding: '12px 16px' }}>
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
