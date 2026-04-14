import React, { useState, useEffect } from 'react';
import StatCard    from './components/StatCard';
import MetricChart from './components/MetricChart';
import LogViewer   from './components/LogViewer';
import AlertsPage  from './pages/AlertsPage';
import { useLatestMetrics, useSummary } from './hooks/useMetrics';
import { LayoutDashboard, BellRing, Sun, Moon, Activity } from 'lucide-react';

// Tab button component
function Tab({ label, active, onClick, icon: Icon }) {
  return (
    <button
      className={`tab-button ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {Icon && <Icon size={18} strokeWidth={2.5} />}
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
      <div className="stats-grid">
        <StatCard label="CPU usage"     value={values.cpu_usage}        unit="%" status={cpuStatus} />
        <StatCard label="Memory used"   value={values.memory_used_pct}  unit="%" status="ok" />
        <StatCard label="Response time" value={values.response_time_ms} unit="ms" status="ok" />
        <StatCard label="Error rate"    value={values.error_rate_pct}   unit="%" status={errStatus} />
        <StatCard label="Active alerts" value={summary?.activeAlerts}   unit="" status="ok" />
      </div>

      {/* Charts */}
      <div className="grid-charts">
        <MetricChart name="cpu_usage"        title="CPU usage (%)"       color="var(--accent)" />
        <MetricChart name="memory_used_pct"  title="Memory used (%)"     color="#0891b2" />
        <MetricChart name="response_time_ms" title="Response time (ms)"  color="#059669" />
        <MetricChart name="error_rate_pct"   title="Error rate (%)"      color="var(--danger-color)" />
      </div>

      {/* Live logs */}
      <LogViewer />
    </>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="app-container">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="header-title-row">
            <Activity size={26} color="var(--accent)" />
            <h1><em>Observability</em> Platform</h1>
          </div>
          <div className="subtitle">Real-time metrics, logs and alerts • Live</div>
        </div>

        <div className="header-right">
          <button onClick={toggleTheme} className="icon-btn" title="Toggle theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────────── */}
      <div className="tabs-container">
        <Tab icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <Tab icon={BellRing} label="Alerts"   active={activeTab === 'alerts'}   onClick={() => setActiveTab('alerts')}   />
      </div>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <div className="page-content">
        {activeTab === 'overview' && <OverviewPage />}
        {activeTab === 'alerts'   && <AlertsPage />}
      </div>
    </div>
  );
}

export default App;