require('dotenv').config();
const cron = require('node-cron');
const { evaluateAllRules } = require('./evaluator');

console.log('[alert-engine] starting...');

async function runEvaluation() {
  try {
    await evaluateAllRules();
  } catch (err) {
    console.error('[alert-engine] evaluation error:', err.message);
  }
}

// Run an initial check shortly after boot, then evaluate every 15 seconds
setTimeout(runEvaluation, 5000);
cron.schedule('*/15 * * * * *', runEvaluation);

console.log('[alert-engine] rule evaluation scheduled every 15s');
