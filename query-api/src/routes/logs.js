const express = require('express');
const { elastic } = require('../clients');
const router = express.Router();

// GET /v1/logs?service=my-api&level=error&q=timeout&from=0&size=50
// Full-text search across all logs — powers the log explorer
router.get('/', async (req, res) => {
  const { service, level, q, from = 0, size = 50 } = req.query;

  const must = [];
  if (service) must.push({ term: { service } });
  if (level)   must.push({ term: { level } });
  if (q)       must.push({ match: { message: q } });

  try {
    const result = await elastic.search({
      index: 'logs',
      from: parseInt(from),
      size: parseInt(size),
      sort: [{ timestamp: { order: 'desc' } }],
      query: must.length > 0 ? { bool: { must } } : { match_all: {} },
    });

    res.json({
      total: result.hits.total.value,
      from: parseInt(from),
      logs: result.hits.hits.map((h) => ({ id: h._id, ...h._source })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /v1/logs/services — list all unique service names
router.get('/services', async (req, res) => {
  try {
    const result = await elastic.search({
      index: 'logs',
      size: 0,
      aggs: {
        services: { terms: { field: 'service', size: 100 } },
      },
    });
    const services = result.aggregations.services.buckets.map((b) => b.key);
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /v1/logs/counts?range=24h — log counts by level (for bar chart)
router.get('/counts', async (req, res) => {
  try {
    const result = await elastic.search({
      index: 'logs',
      size: 0,
      query: {
        range: { timestamp: { gte: 'now-24h' } },
      },
      aggs: {
        by_level: { terms: { field: 'level', size: 10 } },
      },
    });
    const counts = {};
    result.aggregations.by_level.buckets.forEach((b) => {
      counts[b.key] = b.doc_count;
    });
    res.json(counts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
