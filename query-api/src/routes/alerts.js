const express = require('express');
const { pg } = require('../clients');
const router = express.Router();

// ── Auto-create tables if they do not exist ─────────────────────────────────
let dbReady = false;

async function ensureTablesExist() {
  if (dbReady) return true;
  try {
    await pg.query(`
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
    `);
    dbReady = true;
    console.log('[alerts] database tables ready');
    return true;
  } catch (err) {
    console.error('[alerts] cannot reach PostgreSQL:', err.message);
    return false;
  }
}

// Try to initialise tables eagerly (non-blocking)
ensureTablesExist();

// GET /v1/alerts — all rules
router.get('/', async (req, res) => {
  try {
    if (!(await ensureTablesExist())) return res.json([]);
    const result = await pg.query('SELECT * FROM alert_rules ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('[alerts] GET / error:', err.message);
    res.json([]);
  }
});

// POST /v1/alerts — create a new rule
router.post('/', async (req, res) => {
  try {
    if (!(await ensureTablesExist())) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    const { name, metric, condition, threshold, duration_s = 60, severity = 'warning' } = req.body;
    const result = await pg.query(
      `INSERT INTO alert_rules (name, metric, condition, threshold, duration_s, severity)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, metric, condition, threshold, duration_s, severity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[alerts] POST / error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /v1/alerts/:id — enable or disable a rule
router.patch('/:id', async (req, res) => {
  try {
    if (!(await ensureTablesExist())) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    const { enabled } = req.body;
    const result = await pg.query(
      'UPDATE alert_rules SET enabled=$1 WHERE id=$2 RETURNING *',
      [enabled, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[alerts] PATCH /:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /v1/alerts/history — recent fired alerts
router.get('/history', async (req, res) => {
  try {
    if (!(await ensureTablesExist())) return res.json([]);
    const result = await pg.query(`
      SELECT e.*, r.name, r.severity, r.metric
      FROM alert_events e
      JOIN alert_rules r ON r.id = e.rule_id
      ORDER BY e.triggered_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('[alerts] GET /history error:', err.message);
    res.json([]);
  }
});

module.exports = router;