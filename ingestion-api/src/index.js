require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan = require('morgan');
const metricsRouter = require('./routes/metrics');
const logsRouter = require('./routes/logs');

const app = express();
const PORT = process.env.INGESTION_API_PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ingestion-api', ts: Date.now() });
});

app.use('/v1/metrics', metricsRouter);
app.use('/v1/logs', logsRouter);

app.listen(PORT, () => {
  console.log(`[ingestion-api] listening on port ${PORT}`);
});
