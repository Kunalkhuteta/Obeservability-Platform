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
      <label style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: '8px 10px', borderRadius: 8, border: '1px solid #e0e0e0',
  fontSize: 13, outline: 'none', background: '#fff',
  color: '#111',
};

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
    <form onSubmit={handleSubmit} style={{
      background: '#f8f9ff',
      border: '1px solid #e8e8ff',
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
    }}>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>
        Create new alert rule
      </div>

      {/* Row 1: Name + Metric */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <Field label="Rule name">
          <input
            style={inputStyle}
            placeholder="e.g. High CPU"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>

        <Field label="Metric">
          <select style={inputStyle} value={form.metric} onChange={(e) => set('metric', e.target.value)}>
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
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Field label="Condition">
          <select style={inputStyle} value={form.condition} onChange={(e) => set('condition', e.target.value)}>
            <option value="gt">greater than (&gt;)</option>
            <option value="lt">less than (&lt;)</option>
            <option value="eq">equal to (=)</option>
          </select>
        </Field>

        <Field label="Threshold">
          <input
            style={inputStyle}
            type="number"
            placeholder="e.g. 85"
            value={form.threshold}
            onChange={(e) => set('threshold', e.target.value)}
          />
        </Field>

        <Field label="Duration (seconds)">
          <input
            style={inputStyle}
            type="number"
            value={form.duration_s}
            onChange={(e) => set('duration_s', e.target.value)}
          />
        </Field>

        <Field label="Severity">
          <select style={inputStyle} value={form.severity} onChange={(e) => set('severity', e.target.value)}>
            <option value="warning">warning</option>
            <option value="critical">critical</option>
          </select>
        </Field>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ color: '#c62828', fontSize: 13, marginBottom: 12 }}>{error}</div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? '#a5b4fc' : '#4f46e5',
          color: '#fff', border: 'none',
          padding: '9px 24px', borderRadius: 8,
          fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Creating...' : 'Create rule'}
      </button>
    </form>
  );
}

export default CreateRuleForm;
