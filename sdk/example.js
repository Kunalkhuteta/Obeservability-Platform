const ObservabilitySDK = require('./src/index');

// When running locally:  uses http://localhost:4000
// When running in Docker: uses http://ingestion-api:4000
const INGESTION_URL = process.env.INGESTION_URL || 'http://localhost:4000';

const obs = new ObservabilitySDK({
  url:     INGESTION_URL,
  service: 'sdk-example',
  env:     'production',
});

obs.start(3000);              // flush every 3 seconds
obs.startSystemMetrics(5000); // collect CPU/memory every 5 seconds

// Simulate an app doing things
let reqCount = 0;
setInterval(() => {
  reqCount++;

  obs.metric('http_requests_total', reqCount, { route: '/api/users' });
  obs.metric('response_time_ms', Math.floor(Math.random() * 200) + 20);

  obs.info('Handled request', { route: '/api/users', status: 200 });

  if (Math.random() < 0.05) {
    obs.error('Database timeout', { query: 'SELECT * FROM users', duration_ms: 5001 });
    obs.metric('error_rate_pct', 5);
  } else {
    obs.metric('error_rate_pct', 0);
  }
}, 1000);

console.log(`[sdk-example] sending data to ${INGESTION_URL}`);