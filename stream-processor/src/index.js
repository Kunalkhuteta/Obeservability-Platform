require('dotenv').config();
const { processMetrics } = require('./consumers/metricsConsumer');
const { processLogs }    = require('./consumers/logsConsumer');

console.log('[stream-processor] starting...');

// Run both consumers in parallel — each is an infinite loop
Promise.all([
  processMetrics(),
  processLogs(),
]).catch((err) => {
  console.error('[stream-processor] fatal error:', err);
  process.exit(1);
});
