import React, { useState } from 'react';

const DEFAULT = {
  name:       '',
  metric:     'cpu_usage',
  condition:  'gt',
  threshold:  '',
  duration_s: 60,
  severity:   'warning',
};

// Input field wrapper for consistent styling
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
      <label className="label-base">{label}</label>
      {React.cloneElement(children, { className: 'input-base' })}
    </div>
  );
}

// Form for creating a new alert rule
// onSubmit: called with the new rule object when form is submitted
function CreateRuleForm({ onSubmit, loading }) {
  const [form, setForm] = useState(DEFAULT);
  const [error, setError] = useState('');

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!form.name.trim())   return setError('Name is required');
    if (!form.threshold)     return setError('Threshold is required');
    if (isNaN(form.threshold)) return setError('Threshold must be a number');

    onSubmit({
      ...form,
      threshold:  parseFloat(form.threshold),
      duration_s: parseInt(form.duration_s),
    });

    setForm(DEFAULT); // reset form after submit
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
      <div className="card-title">
        Create new alert rule
      </div>

      {/* Row 1: Name + Metric */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <Field label="Rule name">
          <input
            placeholder="e.g. High CPU"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>

        <Field label="Metric">
          <select value={form.metric} onChange={(e) => set('metric', e.target.value)}>
            <option value="cpu_usage">cpu_usage</option>
            <option value="memory_used_pct">memory_used_pct</option>
            <option value="memory_free_mb">memory_free_mb</option>
            <option value="response_time_ms">response_time_ms</option>
            <option value="error_rate_pct">error_rate_pct</option>
            <option value="http_requests_total">http_requests_total</option>
          </select>
        </Field>
      </div>

      {/* Row 2: Condition + Threshold + Duration + Severity */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <Field label="Condition">
          <select value={form.condition} onChange={(e) => set('condition', e.target.value)}>
            <option value="gt">greater than (&gt;)</option>
            <option value="lt">less than (&lt;)</option>
            <option value="eq">equal to (=)</option>
          </select>
        </Field>

        <Field label="Threshold">
          <input
            type="number"
            placeholder="e.g. 85"
            value={form.threshold}
            onChange={(e) => set('threshold', e.target.value)}
          />
        </Field>

        <Field label="Duration (seconds)">
          <input
            type="number"
            value={form.duration_s}
            onChange={(e) => set('duration_s', e.target.value)}
          />
        </Field>

        <Field label="Severity">
          <select value={form.severity} onChange={(e) => set('severity', e.target.value)}>
            <option value="warning">warning</option>
            <option value="critical">critical</option>
          </select>
        </Field>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ color: 'var(--danger-color)', fontSize: 13, marginBottom: 12 }}>{error}</div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary"
        style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Creating...' : 'Create rule'}
      </button>
    </form>
  );
}

export default CreateRuleForm;
