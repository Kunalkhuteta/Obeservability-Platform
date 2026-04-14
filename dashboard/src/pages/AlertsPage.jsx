import React, { useState, useEffect, useCallback } from 'react';
import AlertsTable    from '../components/AlertsTable';
import CreateRuleForm from '../components/CreateRuleForm';
import AlertHistory   from '../components/AlertHistory';
import { AlertsAPI }  from '../api/client';
import { ShieldCheck, ActivitySquare, AlertTriangle, Flame } from 'lucide-react';

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
      <div className="stats-grid">
        <div className="stat-card ok">
          <div className="stat-emoji"><ShieldCheck size={26} color="var(--success-color)" strokeWidth={2.5} /></div>
          <div className="stat-info">
            <div className="stat-value">{rules.length}</div>
            <div className="stat-label">Total rules</div>
          </div>
        </div>

        <div className="stat-card ok">
          <div className="stat-emoji"><ActivitySquare size={26} color="var(--success-color)" strokeWidth={2.5} /></div>
          <div className="stat-info">
            <div className="stat-value">{enabledCount}</div>
            <div className="stat-label">Active rules</div>
          </div>
        </div>

        <div className="stat-card critical">
          <div className="stat-emoji"><AlertTriangle size={26} color="var(--danger-color)" strokeWidth={2.5} /></div>
          <div className="stat-info">
            <div className="stat-value">{criticalCount}</div>
            <div className="stat-label">Critical rules</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-emoji"><Flame size={26} color="var(--warning-color)" strokeWidth={2.5} /></div>
          <div className="stat-info">
            <div className="stat-value">{history.length}</div>
            <div className="stat-label">Fired history</div>
          </div>
        </div>
      </div>

      {/* ── Success / error messages ───────────────────────────────────────── */}
      {successMsg && (
        <div style={{
          background: 'var(--success-light)', border: '1px solid var(--success-color)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, color: 'var(--success-color)',
        }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{
          background: 'var(--danger-light)', border: '1px solid var(--danger-color)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, color: 'var(--danger-color)',
        }}>
          {error}
        </div>
      )}

      {/* ── Create rule form ──────────────────────────────────────────────── */}
      <CreateRuleForm onSubmit={handleCreate} loading={creating} />

      {/* ── Rules table ───────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div className="card-title" style={{ padding: '20px 20px 0 20px' }}>
          Alert rules
          {loadingRules && (
            <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8, textTransform: 'none' }}>loading...</span>
          )}
        </div>
        <AlertsTable rules={rules} onToggle={handleToggle} />
      </div>

      {/* ── Alert history ─────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-title" style={{ padding: '20px 20px 0 20px' }}>
          Recent alert history
        </div>
        <AlertHistory events={history} />
      </div>
    </div>
  );
}

export default AlertsPage;
