const Redis = require('ioredis');
const { Client } = require('@elastic/elasticsearch');

const redis  = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const elastic = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });

const STREAM   = 'stream:logs';
const GROUP    = 'processor-group';
const CONSUMER = 'logs-consumer-1';
const BATCH    = 100;

async function setupGroup() {
  try {
    await redis.xgroup('CREATE', STREAM, GROUP, '$', 'MKSTREAM');
  } catch (err) {
    if (!err.message.includes('BUSYGROUP')) throw err;
  }
}

async function ensureIndex() {
  const exists = await elastic.indices.exists({ index: 'logs' });
  if (!exists) {
    await elastic.indices.create({
      index: 'logs',
      mappings: {
        properties: {
          level:     { type: 'keyword' },
          message:   { type: 'text'    },
          service:   { type: 'keyword' },
          traceId:   { type: 'keyword' },
          meta:      { type: 'object'  },
          timestamp: { type: 'date', format: 'epoch_millis' },
        },
      },
    });
    console.log('[logs-consumer] created "logs" index in Elasticsearch');
  }
}

async function processLogs() {
  await setupGroup();
  await ensureIndex();
  console.log('[logs-consumer] listening on', STREAM);

  while (true) {
    const results = await redis.xreadgroup(
      'GROUP', GROUP, CONSUMER,
      'COUNT', BATCH,
      'BLOCK', 2000,
      'STREAMS', STREAM, '>'
    );

    if (!results) continue;

    const [, messages] = results[0];
    const bulkBody = [];
    const ids = [];

    for (const [id, fields] of messages) {
      try {
        const entry = JSON.parse(fields[1]);
        bulkBody.push({ index: { _index: 'logs' } });
        bulkBody.push(entry);
        ids.push(id);
      } catch (err) {
        console.error('[logs-consumer] parse error:', err.message);
        ids.push(id);
      }
    }

    if (bulkBody.length > 0) {
      await elastic.bulk({ body: bulkBody });
      console.log(`[logs-consumer] indexed ${bulkBody.length / 2} log entries`);
    }

    if (ids.length > 0) {
      await redis.xack(STREAM, GROUP, ...ids);
    }
  }
}

module.exports = { processLogs };
