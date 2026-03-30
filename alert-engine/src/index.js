require('dotenv').config();
const cron = require('node-cron');
const { evaluateAllRules } = require('./evaluator');

console.log('[alert-engine] starting...');

// Evaluate all alert rules every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  try {
    await evaluateAllRules();
  } catch (err) {
    console.error('[alert-engine] evaluation error:', err.message);
  }
});

console.log('[alert-engine] rule evaluation scheduled every 30s');
