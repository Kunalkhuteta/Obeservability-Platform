const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const http    = require('http');
const express = require('express');
const cors    = require('cors');
const { setupWebSocket } = require('./ws/liveStream');

const app    = express();
const server = http.createServer(app); // wrap express so WS can share the port
const PORT   = process.env.QUERY_API_PORT || 4001;

app.use(cors());
app.use(express.json());

// ── REST routes ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'query-api', ts: Date.now() })
);
app.use('/v1/metrics', require('./routes/metrics'));
app.use('/v1/logs',    require('./routes/logs'));
app.use('/v1/alerts',  require('./routes/alerts'));
app.use('/v1/summary', require('./routes/summary'));

// ── WebSocket for live log streaming ────────────────────────────────────────
setupWebSocket(server);

// ── Safety net: keep the process alive on unexpected errors ─────────────────
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

server.listen(PORT, () =>
  console.log(`[query-api] HTTP + WS listening on port ${PORT}`)
);
