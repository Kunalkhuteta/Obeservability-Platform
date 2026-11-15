import React, { useState, useEffect, useCallback } from 'react';
import { useLiveLogs } from '../hooks/useLiveLogs';
import { LogsAPI } from '../api/client';

const LEVEL_COLORS = {
  error: { bg: '#ffebee', text: '#c62828' },
  warn:  { bg: '#fff8e1', text: '#f57f17' },
  info:  { bg: '#e3f2fd', text: '#0d47a1' },
  debug: { bg: '#f3e5f5', text: '#4a148c' },
};

function LogViewer() {
  const { logs: liveLogs, connected } = useLiveLogs(200);
  const [mode, setMode] = useState('live'); // 'live' | 'search'
  const [filter, setFilter] = useState({ level: '', service: '', q: '' });
  const [services, setServices] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      const list = await LogsAPI.getServices();
      if (Array.isArray(list)) setServices(list);
    } catch {}
  }, []);

  useEffect(() => {
    loadServices();
    const id = setInterval(loadServices, 15_000);
    return () => clearInterval(id);
  }, [loadServices]);

  const runSearch = useCallback(async () => {
    setSearching(true);
    try {
      const params = { size: 100 };
      if (filter.level)   params.level   = filter.level;
      if (filter.service) params.service = filter.service;
      if (filter.q.trim()) params.q      = filter.q.trim();
      const res = await LogsAPI.search(params);
      setHistoryLogs(res.logs || []);
    } catch {
      setHistoryLogs([]);
    } finally {
      setSearching(false);
    }
  }, [filter.level, filter.service, filter.q]);

  useEffect(() => {
    if (mode === 'search') {
      runSearch();
    }
  }, [mode, runSearch]);

  const knownServices = Array.from(new Set([
    ...services,
    ...liveLogs.map((l) => l.service).filter(Boolean),
  ])).sort();

  const visible = mode === 'live'
    ? liveLogs.filter((l) => {
        if (filter.level && l.level !== filter.level) return false;
        if (filter.service && l.service !== filter.service) return false;
        if (filter.q.trim()) {
          const needle = filter.q.trim().toLowerCase();
          if (!String(l.message || '').toLowerCase().includes(needle)) return false;
        }
        return true;
      })
    : historyLogs;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>
          {mode === 'live' ? 'Live logs' : 'Log explorer'}
          <span className={`status-badge ${connected ? 'ok' : 'critical'}`} style={{ marginLeft: 12 }}>
            {connected ? '● live' : '○ disconnected'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setMode(mode === 'live' ? 'search' : 'live')}
            className="input-base"
            style={{ width: 'auto', fontSize: 11, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}
          >
            {mode === 'live' ? 'Search History' : 'Back to Live'}
          </button>

          <select
            value={filter.service}
            onChange={(e) => setFilter((f) => ({ ...f, service: e.target.value }))}
            className="input-base"
            style={{ width: 'auto', fontSize: 12, padding: '4px 10px' }}
          >
            <option value="">All services</option>
            {knownServices.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter message..."
            value={filter.q}
            onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            className="input-base"
            style={{ width: 160, fontSize: 12, padding: '4px 10px' }}
          />

          {['', 'debug', 'info', 'warn', 'error'].map((l) => (
            <button
              key={l}
              onClick={() => setFilter((f) => ({ ...f, level: l }))}
              style={{
                fontSize: 11, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                border: '1px solid',
                borderColor: filter.level === l ? 'var(--accent-color)' : 'var(--border)',
                background: filter.level === l ? 'var(--accent-color)' : 'var(--bg-subtle)',
                color:      filter.level === l ? '#fff' : 'var(--text-2)',
                transition: 'all .15s'
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
        background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: 12,
      }}>
        {searching && <div style={{ color: 'var(--text-3)' }}>Searching Elasticsearch...</div>}
        {!searching && visible.length === 0 && (
          <div style={{ color: 'var(--text-3)' }}>
            {mode === 'live' ? 'Waiting for logs...' : 'No matching logs found.'}
          </div>
        )}
        {visible.map((log, i) => {
          const style = LEVEL_COLORS[log.level] || LEVEL_COLORS.info;
          return (
            <div key={log.id || `${log.timestamp}-${i}`} style={{ marginBottom: 4, lineHeight: 1.5 }}>
              <span style={{ color: 'var(--text-3)' }}>
                {new Date(log.timestamp).toLocaleTimeString()}&nbsp;
              </span>
              <span style={{
                background: style.bg, color: style.text,
                padding: '1px 6px', borderRadius: 4, fontSize: 10,
              }}>
                {log.level}
              </span>
              <span style={{ color: 'var(--text-2)', opacity: 0.85 }}>&nbsp;[{log.service}]&nbsp;</span>
              <span style={{ color: 'var(--text)' }}>{log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LogViewer;
