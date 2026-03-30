const { InfluxDB } = require('@influxdata/influxdb-client');
const { Client }   = require('@elastic/elasticsearch');
const { Pool }     = require('pg');

const influx = new InfluxDB({
  url:   process.env.INFLUX_URL   || 'http://localhost:8086',
  token: process.env.INFLUX_TOKEN || 'my-super-secret-token',
});
const influxQuery = influx.getQueryApi(process.env.INFLUX_ORG || 'observability');

const elastic = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });

const pg = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/alerts',
});

// ── Prevent unhandled 'error' events from crashing the process ──────────────
pg.on('error', (err) => {
  console.error('[pg] idle client error:', err.message);
});

module.exports = { influxQuery, elastic, pg };

