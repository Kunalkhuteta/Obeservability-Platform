import React, { useState, useEffect, useCallback } from 'react';
import AlertsTable    from '../components/AlertsTable';
import CreateRuleForm from '../components/CreateRuleForm';
import AlertHistory   from '../components/AlertHistory';
import { AlertsAPI }  from '../api/client';

function AlertsPage() {
  const [rules,       setRules]       = useState([]);
  const [history,     setHistory]     = useState([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [creating,    setCreating]    = useState(false);
  const [error,       setError]       = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');

  // ── Fetch rules + history ─────────────────────────────────────────────────
  const fetchRules = useCallback(async () => {
    try {
      const data = await AlertsAPI.getRules();
      setRules(data);
    } catch (err) {
      setError('Failed to load rules: ' + err.message);
    } finally {
      setLoadingRules(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await AlertsAPI.getHistory();
      setHistory(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchRules();
    fetchHistory();
    // Refresh history every 30 seconds automatically
    const id = setInterval(fetchHistory, 30_000);
    return () => clearInterval(id);
  }, [fetchRules, fetchHistory]);

  // ── Create a new rule ─────────────────────────────────────────────────────
  async function handleCreate(rule) {
    setCreating(true);
    setError('');
    setSuccessMsg('');
    try {
      await AlertsAPI.createRule(rule);
      setSuccessMsg(`Rule "${rule.name}" created successfully`);
      fetchRules(); // refresh the table
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to create rule: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  // ── Toggle enable/disable ─────────────────────────────────────────────────
  async function handleToggle(id, enabled) {
    // Optimistic update — change UI immediately before API responds
    // This makes the toggle feel instant
    setRules((prev) =>
      prev.map((r) => r.id === id ? { ...r, enabled } : r)
    );
    try {
      await AlertsAPI.toggleRule(id, enabled);
    } catch (err) {
      // If API fails, revert the optimistic update
      setRules((prev) =>
        prev.map((r) => r.id === id ? { ...r, enabled: !enabled } : r)
      );
      setError('Failed to update rule');
    }
  }

  // ── Counts for the summary bar ────────────────────────────────────────────
  const enabledCount  = rules.filter((r) => r.enabled).length;
  const criticalCount = rules.filter((r) => r.severity === 'critical' && r.enabled).length;

  return (
    <div>
      {/* ── Summary bar ───────────────────────────────────────────────────── */}
      <div className="grid-cards">
        <div className="card-panel" style={{ flex: 1, minWidth: 120, background: 'var(--accent-light)', borderColor: 'transparent' }}>
          <div style={{ fontSize: 12, color: 'var(--accent-color)', fontWeight: 600 }}>Total rules</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--accent-hover)' }}>{rules.length}</div>
        </div>
        <div className="card-panel" style={{ flex: 1, minWidth: 120, background: 'var(--success-light)', borderColor: 'transparent' }}>
          <div style={{ fontSize: 12, color: 'var(--success-color)', fontWeight: 600 }}>Active</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--success-color)' }}>{enabledCount}</div>
        </div>
        <div className="card-panel" style={{ flex: 1, minWidth: 120, background: 'var(--danger-light)', borderColor: 'transparent' }}>
          <div style={{ fontSize: 12, color: 'var(--danger-color)', fontWeight: 600 }}>Critical rules</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--danger-color)' }}>{criticalCount}</div>
        </div>
        <div className="card-panel" style={{ flex: 1, minWidth: 120, background: 'var(--warning-light)', borderColor: 'transparent' }}>
          <div style={{ fontSize: 12, color: 'var(--warning-color)', fontWeight: 600 }}>Fired today</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--warning-color)' }}>{history.length}</div>
        </div>
      </div>

      {/* ── Success / error messages ───────────────────────────────────────── */}
      {successMsg && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, color: '#15803d',
        }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{
          background: '#fff5f5', border: '1px solid #fca5a5',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, color: '#dc2626',
        }}>
          {error}
        </div>
      )}

      {/* ── Create rule form ──────────────────────────────────────────────── */}
      <CreateRuleForm onSubmit={handleCreate} loading={creating} />

      {/* ── Rules table ───────────────────────────────────────────────────── */}
      <div className="card-panel" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: 'var(--text-primary)' }}>
          Alert rules
          {loadingRules && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>loading...</span>
          )}
        </div>
        <AlertsTable rules={rules} onToggle={handleToggle} />
      </div>

      {/* ── Alert history ─────────────────────────────────────────────────── */}
      <div className="card-panel">
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: 'var(--text-primary)' }}>
          Recent alert history
        </div>
        <AlertHistory events={history} />
      </div>
    </div>
  );
}

export default AlertsPage;
