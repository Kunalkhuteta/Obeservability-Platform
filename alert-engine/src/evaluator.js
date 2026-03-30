const { InfluxDB } = require('@influxdata/influxdb-client');
const { Pool } = require('pg');
const { sendSlackAlert } = require('./notifiers/slack');

const influx = new InfluxDB({
  url:   process.env.INFLUX_URL   || 'http://localhost:8086',
  token: process.env.INFLUX_TOKEN || 'my-super-secret-token',
});
const queryApi = influx.getQueryApi(process.env.INFLUX_ORG || 'observability');

const db = new Pool({ connectionString: process.env.POSTGRES_URL });

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
      |> mean()
  `;

  return new Promise((resolve, reject) => {
    let avg = null;
    queryApi.queryRows(flux, {
      next(row, tableMeta) {
        const obj = tableMeta.toObject(row);
        avg = obj._value;
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
    const value = await queryLatestMetric(rule.metric, rule.duration_s);

    if (value === null) continue; // no data yet

    if (breaches(value, rule.condition, parseFloat(rule.threshold))) {
      console.warn(`[ALERT] ${rule.name} — ${rule.metric}=${value} (threshold=${rule.threshold})`);

      await db.query(
        'INSERT INTO alert_events (rule_id, value, message) VALUES ($1, $2, $3)',
        [rule.id, value, `${rule.name}: ${rule.metric} is ${value}`]
      );

      if (rule.channel === 'slack' && process.env.SLACK_WEBHOOK_URL) {
        await sendSlackAlert(rule, value);
      }
    }
  }
}

module.exports = { evaluateAllRules };
