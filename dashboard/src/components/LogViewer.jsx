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
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>
          Live logs
          <span style={{
            marginLeft: 8, fontSize: 11,
            color: connected ? '#2e7d32' : '#c62828',
          }}>
            {connected ? '● live' : '○ disconnected'}
          </span>
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'debug', 'info', 'warn', 'error'].map((l) => (
            <button
              key={l}
              onClick={() => setFilter((f) => ({ ...f, level: l }))}
              style={{
                fontSize: 11, padding: '2px 10px', borderRadius: 20, cursor: 'pointer',
                border: '1px solid #ddd',
                background: filter.level === l ? '#111' : '#fff',
                color:      filter.level === l ? '#fff' : '#333',
              }}
            >
              {l || 'all'}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        fontFamily: 'monospace', fontSize: 12,
        height: 320, overflowY: 'auto',
        background: '#0d1117', borderRadius: 8, padding: 12,
      }}>
        {visible.length === 0 && (
          <div style={{ color: '#666' }}>Waiting for logs...</div>
        )}
        {visible.map((log, i) => {
          const style = LEVEL_COLORS[log.level] || LEVEL_COLORS.info;
          return (
            <div key={i} style={{ marginBottom: 4, lineHeight: 1.5 }}>
              <span style={{ color: '#666' }}>
                {new Date(log.timestamp).toLocaleTimeString()}&nbsp;
              </span>
              <span style={{
                background: style.bg, color: style.text,
                padding: '1px 6px', borderRadius: 4, fontSize: 10,
              }}>
                {log.level}
              </span>
              <span style={{ color: '#8b949e' }}>&nbsp;[{log.service}]&nbsp;</span>
              <span style={{ color: '#c9d1d9' }}>{log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LogViewer;
