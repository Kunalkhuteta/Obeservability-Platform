CREATE TABLE IF NOT EXISTS alert_rules (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  metric      VARCHAR(255) NOT NULL,
  condition   VARCHAR(10)  NOT NULL,
  threshold   NUMERIC      NOT NULL,
  duration_s  INTEGER      NOT NULL DEFAULT 60,
  severity    VARCHAR(20)  NOT NULL DEFAULT 'warning',
  channel     VARCHAR(50)  NOT NULL DEFAULT 'slack',
  enabled     BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_events (
  id           SERIAL PRIMARY KEY,
  rule_id      INTEGER REFERENCES alert_rules(id),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ,
  value        NUMERIC NOT NULL,
  message      TEXT
);

INSERT INTO alert_rules (name, metric, condition, threshold, duration_s, severity) VALUES
  ('High CPU',        'cpu_usage',      'gt', 85, 60, 'warning'),
  ('Critical CPU',    'cpu_usage',      'gt', 95, 30, 'critical'),
  ('Low memory',      'memory_free_mb', 'lt', 256, 60, 'warning'),
  ('High error rate', 'error_rate_pct', 'gt', 1,  30, 'critical');
