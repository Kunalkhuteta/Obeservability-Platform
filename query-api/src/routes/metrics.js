const express = require('express');
const { influxQuery } = require('../clients');
const router = express.Router();
const BUCKET = process.env.INFLUX_BUCKET || 'metrics';

const SAFE_DURATION = /^\d+[smhd]$/;
const SAFE_IDENT    = /^[a-zA-Z0-9_.-]+$/;

async function runFlux(flux) {
  const rows = [];
  await new Promise((resolve, reject) => {
    influxQuery.queryRows(flux, {
      next(row, meta) { rows.push(meta.toObject(row)); },
      error: reject,
      complete: resolve,
    });
  });
  return rows;
}

// GET /v1/metrics/series?name=cpu_usage&range=1h&window=1m
// Returns time-series array — powers line charts
router.get('/series', async (req, res) => {
  const { name = 'cpu_usage', range = '1h', window = '1m', service } = req.query;
  if (!SAFE_IDENT.test(name) || !SAFE_DURATION.test(range) || !SAFE_DURATION.test(window)) {
    return res.status(400).json({ error: 'Invalid query parameter' });
  }
  const serviceFilter = service && SAFE_IDENT.test(service)
    ? `|> filter(fn: (r) => r.service == "${service}")`
    : '';

  try {
    const rows = await runFlux(`
      from(bucket: "${BUCKET}")
        |> range(start: -${range})
        |> filter(fn: (r) => r._measurement == "${name}")
        ${serviceFilter}
        |> keep(columns: ["_time", "_value", "_measurement"])
        |> group(columns: ["_measurement"])
        |> aggregateWindow(every: ${window}, fn: mean, createEmpty: false)
        |> sort(columns: ["_time"])
    `);
    res.json({
      metric: name,
      range,
      points: rows.map((r) => ({ time: r._time, value: parseFloat((r._value ?? 0).toFixed(2)) })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /v1/metrics/latest?names=cpu_usage,memory_used_pct
// Returns single latest value per metric — powers stat cards
router.get('/latest', async (req, res) => {
  const names = (req.query.names || 'cpu_usage').split(',').map((n) => n.trim()).filter(Boolean);
  try {
    const results = {};
    await Promise.all(names.map(async (name) => {
      if (!SAFE_IDENT.test(name)) {
        results[name] = null;
        return;
      }
      const rows = await runFlux(`
        from(bucket: "${BUCKET}")
          |> range(start: -5m)
          |> filter(fn: (r) => r._measurement == "${name}")
          |> keep(columns: ["_time", "_value", "_measurement"])
          |> group(columns: ["_measurement"])
          |> sort(columns: ["_time"])
          |> last()
      `);
      results[name] = rows.length > 0 && rows[0]._value != null
        ? parseFloat(Number(rows[0]._value).toFixed(2))
        : null;
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /v1/metrics/available — list all metric names for dropdowns
router.get('/available', async (req, res) => {
  try {
    const rows = await runFlux(`
      import "influxdata/influxdb/schema"
      schema.measurements(bucket: "${BUCKET}")
    `);
    res.json(rows.map((r) => r._value));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
