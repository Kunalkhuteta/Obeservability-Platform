const Redis = require('ioredis');
const { Client } = require('@elastic/elasticsearch');

const redis  = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const elastic = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });

const STREAM   = 'stream:logs';
const GROUP    = 'processor-group';
const CONSUMER = 'logs-consumer-1';
const BATCH    = 100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractFieldData(fields) {
  const idx = fields.indexOf('data');
  return idx >= 0 ? fields[idx + 1] : fields[1];
}

async function setupGroup() {
  while (true) {
    try {
      await redis.xgroup('CREATE', STREAM, GROUP, '0', 'MKSTREAM');
      return;
    } catch (err) {
      if (err.message.includes('BUSYGROUP')) return;
      console.error('[logs-consumer] waiting for Redis:', err.message);
      await sleep(2000);
    }
  }
}

async function ensureIndex() {
  while (true) {
    try {
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
      return;
    } catch (err) {
      console.error('[logs-consumer] waiting for Elasticsearch:', err.message);
      await sleep(3000);
    }
  }
}

async function processLogs() {
  await setupGroup();
  await ensureIndex();
  console.log('[logs-consumer] listening on', STREAM);

  while (true) {
    try {
      const results = await redis.xreadgroup(
        'GROUP', GROUP, CONSUMER,
        'COUNT', BATCH,
        'BLOCK', 2000,
        'STREAMS', STREAM, '>'
      );

      if (!results) continue;

      const [, messages] = results[0];
      const operations = [];
      const ids = [];

      for (const [id, fields] of messages) {
        try {
          const entry = JSON.parse(extractFieldData(fields));
          operations.push({ index: { _index: 'logs' } });
          operations.push(entry);
          ids.push(id);
        } catch (err) {
          console.error('[logs-consumer] parse error:', err.message);
          ids.push(id);
        }
      }

      if (operations.length > 0) {
        const resp = await elastic.bulk({ operations });
        if (resp.errors) {
          console.error('[logs-consumer] bulk had item errors');
        } else {
          console.log(`[logs-consumer] indexed ${operations.length / 2} log entries`);
        }
      }

      if (ids.length > 0) {
        await redis.xack(STREAM, GROUP, ...ids);
      }
    } catch (err) {
      console.error('[logs-consumer] error:', err.message);
      await sleep(2000);
    }
  }
}

module.exports = { processLogs };
