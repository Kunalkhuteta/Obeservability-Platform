const express = require('express');
const { influxQuery } = require('../clients');
const router = express.Router();
const BUCKET = process.env.INFLUX_BUCKET || 'metrics';

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
  const { name = 'cpu_usage', range = '1h', window = '1m' } = req.query;
  try {
    const rows = await runFlux(`
      from(bucket: "${BUCKET}")
        |> range(start: -${range})
        |> filter(fn: (r) => r._measurement == "${name}")
        |> aggregateWindow(every: ${window}, fn: mean, createEmpty: false)
        |> sort(columns: ["_time"])
    `);
    res.json({
      metric: name,
      range,
      points: rows.map((r) => ({ time: r._time, value: parseFloat(r._value?.toFixed(2) ?? 0) })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /v1/metrics/latest?names=cpu_usage,memory_used_pct
// Returns single latest value per metric — powers stat cards
router.get('/latest', async (req, res) => {
  const names = (req.query.names || 'cpu_usage').split(',');
  try {
    const results = {};
    await Promise.all(names.map(async (name) => {
      const rows = await runFlux(`
        from(bucket: "${BUCKET}")
          |> range(start: -5m)
          |> filter(fn: (r) => r._measurement == "${name.trim()}")
          |> last()
      `);
      results[name.trim()] = rows.length > 0 ? parseFloat(rows[0]._value?.toFixed(2) ?? 0) : null;
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
