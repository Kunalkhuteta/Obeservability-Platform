import React, { useState } from 'react';
import StatCard    from './components/StatCard';
import MetricChart from './components/MetricChart';
import LogViewer   from './components/LogViewer';
import AlertsPage  from './pages/AlertsPage';
import { useLatestMetrics, useSummary } from './hooks/useMetrics';

// Tab button component
function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 20px',
        border: 'none',
        borderBottom: active ? '2px solid #4f46e5' : '2px solid transparent',
        background: 'none',
        fontSize: 14,
        fontWeight: active ? 500 : 400,
        color: active ? '#4f46e5' : '#666',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function OverviewPage() {
  const { values } = useLatestMetrics([
    'cpu_usage', 'memory_used_pct', 'response_time_ms', 'error_rate_pct',
  ]);
  const { summary } = useSummary();

  const cpuStatus =
    (values.cpu_usage || 0) > 90 ? 'critical' :
    (values.cpu_usage || 0) > 75 ? 'warning'  : 'ok';

  const errStatus =
    (values.error_rate_pct || 0) > 5 ? 'critical' :
    (values.error_rate_pct || 0) > 1 ? 'warning'  : 'ok';

  return (
    <>
      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="CPU usage"     value={values.cpu_usage}        unit="%" status={cpuStatus} />
        <StatCard label="Memory used"   value={values.memory_used_pct}  unit="%" status="ok" />
        <StatCard label="Response time" value={values.response_time_ms} unit="ms" status="ok" />
        <StatCard label="Error rate"    value={values.error_rate_pct}   unit="%" status={errStatus} />
        <StatCard label="Active alerts" value={summary?.activeAlerts}   unit="" status="ok" />
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        <MetricChart name="cpu_usage"        title="CPU usage (%)"       color="#4f46e5" />
        <MetricChart name="memory_used_pct"  title="Memory used (%)"     color="#0891b2" />
        <MetricChart name="response_time_ms" title="Response time (ms)"  color="#059669" />
        <MetricChart name="error_rate_pct"   title="Error rate (%)"      color="#dc2626" />
      </div>

      {/* Live logs */}
      <LogViewer />
    </>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#f8f9fa',
      minHeight: '100vh',
    }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ padding: '16px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111' }}>
            Observability Platform
          </div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
            Real-time metrics, logs and alerts
          </div>
        </div>

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16a34a' }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#16a34a',
          }} />
          Live
        </div>
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '0 24px',
        display: 'flex',
        gap: 4,
      }}>
        <Tab label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <Tab label="Alerts"   active={activeTab === 'alerts'}   onClick={() => setActiveTab('alerts')}   />
      </div>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {activeTab === 'overview' && <OverviewPage />}
        {activeTab === 'alerts'   && <AlertsPage />}
      </div>
    </div>
  );
}

export default App;