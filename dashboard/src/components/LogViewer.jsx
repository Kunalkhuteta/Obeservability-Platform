import React, { useState } from 'react';
import { useLiveLogs } from '../hooks/useLiveLogs';

const LEVEL_COLORS = {
  error: { bg: '#ffebee', text: '#c62828' },
  warn:  { bg: '#fff8e1', text: '#f57f17' },
  info:  { bg: '#e3f2fd', text: '#0d47a1' },
  debug: { bg: '#f3e5f5', text: '#4a148c' },
};

function LogViewer() {
  const { logs, connected } = useLiveLogs(200);
  const [filter, setFilter] = useState({ level: '', service: '' });

  const visible = logs.filter((l) => {
    if (filter.level   && l.level   !== filter.level)   return false;
    if (filter.service && l.service !== filter.service) return false;
    return true;
  });

  return (
    <div className="card-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)' }}>
          Live logs
          <span className={`status-badge ${connected ? 'ok' : 'critical'}`} style={{ marginLeft: 12 }}>
            {connected ? '● live' : '○ disconnected'}
          </span>
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'debug', 'info', 'warn', 'error'].map((l) => (
            <button
              key={l}
              onClick={() => setFilter((f) => ({ ...f, level: l }))}
              style={{
                fontSize: 11, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                border: '1px solid',
                borderColor: filter.level === l ? 'var(--accent-color)' : 'var(--border-color)',
                background: filter.level === l ? 'var(--accent-color)' : 'var(--bg-base)',
                color:      filter.level === l ? '#fff' : 'var(--text-secondary)',
                transition: 'var(--transition)'
              }}
            >
              {l || 'all'}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12,
        height: 320, overflowY: 'auto',
        background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12,
      }}>
        {visible.length === 0 && (
          <div style={{ color: 'var(--text-secondary)' }}>Waiting for logs...</div>
        )}
        {visible.map((log, i) => {
          const style = LEVEL_COLORS[log.level] || LEVEL_COLORS.info;
          return (
            <div key={i} style={{ marginBottom: 4, lineHeight: 1.5 }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {new Date(log.timestamp).toLocaleTimeString()}&nbsp;
              </span>
              <span style={{
                background: style.bg, color: style.text,
                padding: '1px 6px', borderRadius: 4, fontSize: 10,
              }}>
                {log.level}
              </span>
              <span style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>&nbsp;[{log.service}]&nbsp;</span>
              <span style={{ color: 'var(--text-primary)' }}>{log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LogViewer;
