const WebSocket = require('ws');
const Redis     = require('ioredis');

// This is a SEPARATE Redis connection just for reading the stream
// We don't want to share the same connection used by other parts
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 500, 5000);
    console.log(`[redis] reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
});

redis.on('error', (err) => {
  console.error('[redis] connection error:', err.message);
});

let wss;

function matchesFilter(entry, filter) {
  if (!filter) return true;
  if (filter.service && entry.service !== filter.service) return false;
  if (filter.level && entry.level !== filter.level) return false;
  return true;
}

function setupWebSocket(httpServer) {
  wss = new WebSocket.Server({ server: httpServer, path: '/ws/logs' });

  wss.on('connection', async (ws) => {
    console.log('[ws] client connected');
    ws._filter = {};

    ws.on('message', (raw) => {
      try { ws._filter = JSON.parse(raw); } catch {}
    });

    ws.on('close', () => console.log('[ws] client disconnected'));
    ws.on('error', (err) => console.error('[ws] error:', err.message));

    // Replay the most recent logs from Redis so the UI is populated immediately
    try {
      const recent = await redis.xrevrange('stream:logs', '+', '-', 'COUNT', 50);
      if (recent && recent.length > 0 && ws.readyState === WebSocket.OPEN) {
        const chronological = [...recent].reverse();
        for (const [, fields] of chronological) {
          const idx = fields.indexOf('data');
          const raw = idx >= 0 ? fields[idx + 1] : fields[1];
          const entry = JSON.parse(raw);
          if (matchesFilter(entry, ws._filter)) {
            ws.send(JSON.stringify(entry));
          }
        }
      }
    } catch (err) {
      console.error('[ws] replay error:', err.message);
    }
  });

  // Poll the Redis stream and broadcast to all connected WS clients
  startBroadcasting();

  console.log('[ws] live log stream ready at ws://localhost:4001/ws/logs');
}

let lastId = '$'; // start from newest messages only

async function startBroadcasting() {
  // Explicitly connect since we use lazyConnect
  try {
    await redis.connect();
  } catch (err) {
    console.error('[redis] initial connect failed:', err.message);
  }

  while (true) {
    try {
      const results = await redis.xread(
        'COUNT', 50,
        'BLOCK', 1000,
        'STREAMS', 'stream:logs', lastId
      );

      if (!results) continue;

      const [, messages] = results[0];

      for (const [id, fields] of messages) {
        lastId = id;
        const idx = fields.indexOf('data');
        const raw = idx >= 0 ? fields[idx + 1] : fields[1];
        const entry = JSON.parse(raw);

        // Send to all connected dashboard clients matching their filter
        if (wss) {
          const payload = JSON.stringify(entry);
          wss.clients.forEach((client) => {
            if (client.readyState !== WebSocket.OPEN) return;
            if (!matchesFilter(entry, client._filter)) return;
            client.send(payload);
          });
        }
      }
    } catch (err) {
      console.error('[ws-broadcaster] error:', err.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

module.exports = { setupWebSocket };
