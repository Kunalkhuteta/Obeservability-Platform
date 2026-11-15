const { InfluxDB } = require('@influxdata/influxdb-client');
const { Pool } = require('pg');
const { sendSlackAlert } = require('./notifiers/slack');

const influx = new InfluxDB({
  url:   process.env.INFLUX_URL   || 'http://localhost:8086',
  token: process.env.INFLUX_TOKEN || 'my-super-secret-token',
});
const queryApi = influx.getQueryApi(process.env.INFLUX_ORG || 'observability');
const db = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@127.0.0.1:5434/alerts',
});

db.on('error', (err) => {
  console.error('[pg] unexpected error:', err.message);
});

async function getAlertRules() {
  const result = await db.query(
    'SELECT * FROM alert_rules WHERE enabled = true'
  );
  return result.rows;
}

async function queryLatestMetric(metricName, durationSeconds) {
  const flux = `
    from(bucket: "${process.env.INFLUX_BUCKET || 'metrics'}")
      |> range(start: -${durationSeconds}s)
      |> filter(fn: (r) => r._measurement == "${metricName}")
      |> keep(columns: ["_time", "_value", "_measurement"])
      |> group()
      |> mean()
  `;

  return new Promise((resolve, reject) => {
    let avg = null;
    queryApi.queryRows(flux, {
      next(row, tableMeta) {
        const obj = tableMeta.toObject(row);
        if (obj._value != null) avg = obj._value;
      },
      error: reject,
      complete() { resolve(avg); },
    });
  });
}

function breaches(value, condition, threshold) {
  if (condition === 'gt') return value > threshold;
  if (condition === 'lt') return value < threshold;
  if (condition === 'eq') return value === threshold;
  return false;
}

async function evaluateAllRules() {
  const rules = await getAlertRules();
  console.log(`[evaluator] checking ${rules.length} rules...`);

  for (const rule of rules) {
    try {
      const value = await queryLatestMetric(rule.metric, rule.duration_s);

      if (value === null) continue; // no data yet

      const openEventRes = await db.query(
        'SELECT id FROM alert_events WHERE rule_id = $1 AND resolved_at IS NULL ORDER BY triggered_at DESC LIMIT 1',
        [rule.id]
      );
      const hasOpenEvent = openEventRes.rows.length > 0;

      if (breaches(value, rule.condition, parseFloat(rule.threshold))) {
        if (!hasOpenEvent) {
          const rounded = Number(value).toFixed(2);
          console.warn(`[ALERT] ${rule.name} — ${rule.metric}=${rounded} (threshold=${rule.threshold})`);

          await db.query(
            'INSERT INTO alert_events (rule_id, value, message) VALUES ($1, $2, $3)',
            [rule.id, value, `${rule.name}: ${rule.metric} is ${rounded}`]
          );

          if (rule.channel === 'slack') {
            await sendSlackAlert(rule, value);
          }
        }
      } else if (hasOpenEvent) {
        await db.query(
          'UPDATE alert_events SET resolved_at = NOW() WHERE rule_id = $1 AND resolved_at IS NULL',
          [rule.id]
        );
        console.log(`[RESOLVED] ${rule.name} — ${rule.metric}=${Number(value).toFixed(2)}`);
      }
    } catch (err) {
      console.error(`[evaluator] rule "${rule.name}" check failed:`, err.message);
    }
  }
}

module.exports = { evaluateAllRules };
