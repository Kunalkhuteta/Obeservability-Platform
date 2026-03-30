const Redis = require('ioredis');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const influx = new InfluxDB({
  url:   process.env.INFLUX_URL   || 'http://localhost:8086',
  token: process.env.INFLUX_TOKEN || 'my-super-secret-token',
});
const writeApi = influx.getWriteApi(
  process.env.INFLUX_ORG    || 'observability',
  process.env.INFLUX_BUCKET || 'metrics',
  'ms' // timestamp precision
);

const STREAM  = 'stream:metrics';
const GROUP   = 'processor-group';
const CONSUMER = 'metrics-consumer-1';
const BATCH   = 100; // read up to 100 messages at a time

async function setupGroup() {
  try {
    await redis.xgroup('CREATE', STREAM, GROUP, '$', 'MKSTREAM');
  } catch (err) {
    if (!err.message.includes('BUSYGROUP')) throw err;
    // Group already exists — that's fine
  }
}

async function processMetrics() {
  await setupGroup();
  console.log('[metrics-consumer] listening on', STREAM);

  while (true) {
    // XREADGROUP blocks for up to 2s waiting for new messages
    const results = await redis.xreadgroup(
      'GROUP', GROUP, CONSUMER,
      'COUNT', BATCH,
      'BLOCK', 2000,
      'STREAMS', STREAM, '>'
    );

    if (!results) continue; // timeout — loop again

    const [, messages] = results[0];

    const points = [];
    const ids = [];

    for (const [id, fields] of messages) {
      try {
        const metric = JSON.parse(fields[1]); // fields = ['data', '{...}']

        const point = new Point(metric.name)
          .floatField('value', metric.value)
          .timestamp(new Date(metric.timestamp));

        // Add all tags (host, env, service, etc.)
        for (const [k, v] of Object.entries(metric.tags || {})) {
          point.tag(k, String(v));
        }

        points.push(point);
        ids.push(id);
      } catch (err) {
        console.error('[metrics-consumer] parse error:', err.message);
        ids.push(id); // still ACK bad messages so they don't block
      }
    }

    // Write to InfluxDB in one batch
    if (points.length > 0) {
      writeApi.writePoints(points);
      await writeApi.flush();
      console.log(`[metrics-consumer] wrote ${points.length} points`);
    }

    // ACK processed messages so they're removed from the pending list
    if (ids.length > 0) {
      await redis.xack(STREAM, GROUP, ...ids);
    }
  }
}

module.exports = { processMetrics };
