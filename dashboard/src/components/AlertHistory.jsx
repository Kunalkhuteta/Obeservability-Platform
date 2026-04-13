import React from 'react';

// Shows how long ago a date was in human readable form
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Shows the list of recent alert firings from the database
function AlertHistory({ events }) {
  if (!events || events.length === 0) {
    return (
      <div style={{ color: '#999', fontSize: 14, padding: '12px 0' }}>
        No alerts have fired yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {events.map((event) => {
        const isCritical = event.severity === 'critical';
        return (
          <div
            key={event.id}
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 8,
              background: isCritical ? 'var(--danger-light)' : 'var(--warning-light)',
              border: `1px solid ${isCritical ? 'var(--danger-color)' : 'var(--warning-color)'}`,
              opacity: 0.9,
            }}
          >
            {/* Left side — rule name + metric value */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isCritical ? 'var(--danger-color)' : 'var(--warning-color)',
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{event.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {event.metric} = <strong>{parseFloat(event.value).toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* Right side — time */}
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
              {timeAgo(event.triggered_at)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AlertHistory;
