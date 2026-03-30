// How any app would use your SDK
const ObservabilitySDK = require('./src/index');

const obs = new ObservabilitySDK({
  url:     'http://localhost:4000',
  service: 'my-api',
  env:     'production',
});

obs.start(3000);             // flush every 3 seconds
obs.startSystemMetrics(5000); // collect CPU/memory every 5 seconds

// Simulate an app doing things
let reqCount = 0;
setInterval(() => {
  reqCount++;

  // Send a custom metric
  obs.metric('http_requests_total', reqCount, { route: '/api/users' });
  obs.metric('response_time_ms', Math.floor(Math.random() * 200) + 20);

  // Send logs
  obs.info('Handled request', { route: '/api/users', status: 200 });

  if (Math.random() < 0.05) {
    obs.error('Database timeout', { query: 'SELECT * FROM users', duration_ms: 5001 });
    obs.metric('error_rate_pct', 5);
  }
}, 1000);

console.log('Example app running — sending data to ingestion API...');
