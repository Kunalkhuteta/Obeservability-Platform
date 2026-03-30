const express = require('express');
const { influxQuery, elastic, pg } = require('../clients');
const router = express.Router();
const BUCKET = process.env.INFLUX_BUCKET || 'metrics';

// GET /v1/summary — single endpoint for dashboard overview cards
// Calls InfluxDB + Elasticsearch + Postgres in parallel
router.get('/', async (req, res) => {
  try {
    const [metrics, logCounts, activeAlerts] = await Promise.all([
      // Latest system metrics
      new Promise((resolve) => {
        const vals = {};
        influxQuery.queryRows(
          `from(bucket: "${BUCKET}") |> range(start: -5m) |> last()`,
          {
            next(row, meta) {
              const obj = meta.toObject(row);
              vals[obj._measurement] = parseFloat(obj._value?.toFixed(2) ?? 0);
            },
            error: () => resolve({}),
            complete: () => resolve(vals),
          }
        );
      }),

      // Log counts by level in last hour
      elastic.search({
        index: 'logs',
        size: 0,
        query: { range: { timestamp: { gte: 'now-1h' } } },
        aggs: { by_level: { terms: { field: 'level', size: 10 } } },
      }).then((r) => {
        const counts = {};
        r.aggregations.by_level.buckets.forEach((b) => { counts[b.key] = b.doc_count; });
        return counts;
      }).catch(() => ({})),

      // Active alert rules count
      pg.query('SELECT COUNT(*) FROM alert_rules WHERE enabled = true')
        .then((r) => parseInt(r.rows[0].count))
        .catch(() => 0),
    ]);

    res.json({ metrics, logCounts, activeAlerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
