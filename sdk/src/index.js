const axios  = require('axios');
const osUtils = require('os-utils');

class ObservabilitySDK {
  constructor({ url, service, env = 'production' }) {
    this.url      = url;   // e.g. "http://localhost:4000"
    this.service  = service;
    this.env      = env;
    this._queue   = { metrics: [], logs: [] };
    this._flushInterval = null;
  }

  // ── Metrics ────────────────────────────────────────────────────────────────

  metric(name, value, tags = {}) {
    this._queue.metrics.push({
      name,
      value,
      tags: { service: this.service, env: this.env, ...tags },
      timestamp: Date.now(),
    });
  }

  // ── Logs ───────────────────────────────────────────────────────────────────

  log(level, message, meta = {}) {
    this._queue.logs.push({
      level,
      message,
      service: this.service,
      meta,
      timestamp: Date.now(),
    });
  }

  info(message, meta)  { this.log('info',  message, meta); }
  warn(message, meta)  { this.log('warn',  message, meta); }
  error(message, meta) { this.log('error', message, meta); }
  debug(message, meta) { this.log('debug', message, meta); }

  // ── System metrics (CPU + memory) ──────────────────────────────────────────

  startSystemMetrics(intervalMs = 5000) {
    setInterval(() => {
      osUtils.cpuUsage((cpu) => {
        this.metric('cpu_usage', parseFloat((cpu * 100).toFixed(2)));
      });
      this.metric('memory_used_pct',
        parseFloat(((1 - osUtils.freememPercentage()) * 100).toFixed(2))
      );
      this.metric('memory_free_mb', osUtils.freemem());
    }, intervalMs);

    console.log(`[sdk] system metrics collection started (every ${intervalMs}ms)`);
  }

  // ── Flush queue to ingestion API ───────────────────────────────────────────

  async flush() {
    const metrics = this._queue.metrics.splice(0);
    const logs    = this._queue.logs.splice(0);

    const sends = [];

    if (metrics.length > 0) {
      sends.push(
        axios.post(`${this.url}/v1/metrics`, metrics).catch((err) => {
          console.error('[sdk] failed to send metrics:', err.message);
        })
      );
    }

    if (logs.length > 0) {
      sends.push(
        axios.post(`${this.url}/v1/logs`, logs).catch((err) => {
          console.error('[sdk] failed to send logs:', err.message);
        })
      );
    }

    await Promise.all(sends);
  }

  // Start auto-flush every N ms (default: 3s)
  start(flushIntervalMs = 3000) {
    this._flushInterval = setInterval(() => this.flush(), flushIntervalMs);
    console.log(`[sdk] started — flushing every ${flushIntervalMs}ms to ${this.url}`);
    return this;
  }

  stop() {
    clearInterval(this._flushInterval);
    return this.flush(); // final flush
  }
}

module.exports = ObservabilitySDK;
