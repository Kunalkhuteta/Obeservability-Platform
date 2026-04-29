/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║            Observability Platform — Browser SDK v1.0.0             ║
 * ║                                                                    ║
 * ║  Universal, zero-dependency SDK for any web application.           ║
 * ║  Works with Angular, React, Vue, plain HTML — anything.            ║
 * ║                                                                    ║
 * ║  Usage (script tag):                                               ║
 * ║    <script src="observability-browser-sdk.js"></script>            ║
 * ║    <script>                                                        ║
 * ║      ObservabilitySDK.init({ url: 'http://localhost:4000',        ║
 * ║                              service: 'my-website' });            ║
 * ║    </script>                                                       ║
 * ║                                                                    ║
 * ║  Usage (ES module):                                                ║
 * ║    import { ObservabilitySDK } from './observability-browser-sdk'; ║
 * ║    ObservabilitySDK.init({ url: '...', service: '...' });         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

(function (root) {
  'use strict';

  // ── Internal state ──────────────────────────────────────────────────────
  let _config = {
    url: 'http://localhost:4000',
    service: 'browser-app',
    env: 'production',
    flushInterval: 5000,   // ms between batch sends
    maxQueueSize: 200,     // max queued items before forced flush
    autoTrack: true,       // auto-hook errors, fetch, XHR, navigation
    debug: false,          // console.log SDK activity
  };

  const _queue = { metrics: [], logs: [] };
  let _flushTimer = null;
  let _initialized = false;
  let _pageLoadStart = Date.now();

  // ── Helpers ─────────────────────────────────────────────────────────────

  function _log(msg, data) {
    if (_config.debug) console.log(`[observability-sdk] ${msg}`, data || '');
  }

  function _timestamp() {
    return Date.now();
  }

  function _sendData(endpoint, payload) {
    const url = `${_config.url}${endpoint}`;
    const json = JSON.stringify(payload);

    // Primary: use fetch with keepalive (supports CORS preflight properly)
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
      keepalive: true,
    }).then(function (res) {
      _log('sent to ' + endpoint, payload.length + ' items → ' + res.status);
    }).catch(function (err) {
      _log('send failed: ' + err.message + ', trying sendBeacon fallback');
      // Fallback: try sendBeacon with text/plain (no CORS preflight needed)
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([json], { type: 'text/plain' }));
      }
    });
  }

  // ── Queue + Flush ──────────────────────────────────────────────────────

  function _enqueueMetric(name, value, tags) {
    _queue.metrics.push({
      name: name,
      value: value,
      tags: Object.assign({ service: _config.service, env: _config.env, source: 'browser' }, tags || {}),
      timestamp: _timestamp(),
    });
    if (_queue.metrics.length >= _config.maxQueueSize) _flush();
  }

  function _enqueueLog(level, message, meta) {
    _queue.logs.push({
      level: level,
      message: message,
      service: _config.service,
      meta: Object.assign({ userAgent: navigator.userAgent, pageUrl: location.href }, meta || {}),
      timestamp: _timestamp(),
    });
    if (_queue.logs.length >= _config.maxQueueSize) _flush();
  }

  function _flush() {
    var metrics = _queue.metrics.splice(0);
    var logs    = _queue.logs.splice(0);

    if (metrics.length > 0) _sendData('/v1/metrics', metrics);
    if (logs.length > 0)    _sendData('/v1/logs', logs);
  }

  // ── Auto-tracking hooks ────────────────────────────────────────────────

  function _hookErrors() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', function (evt) {
      _enqueueLog('error', evt.message || 'Unknown error', {
        filename: evt.filename,
        lineno: evt.lineno,
        colno: evt.colno,
        stack: evt.error ? evt.error.stack : null,
        type: 'uncaught_error',
      });
      _log('captured error', evt.message);
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', function (evt) {
      var reason = evt.reason;
      var message = reason instanceof Error ? reason.message : String(reason);
      _enqueueLog('error', 'Unhandled Promise Rejection: ' + message, {
        stack: reason instanceof Error ? reason.stack : null,
        type: 'unhandled_rejection',
      });
      _log('captured rejection', message);
    });

    _log('error tracking hooked');
  }

  function _hookFetch() {
    var _originalFetch = window.fetch;
    if (!_originalFetch) return;

    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input.url || '');
      var method = (init && init.method) || 'GET';
      var start = performance.now();

      // Don't intercept our own SDK calls to avoid infinite loops
      if (url.indexOf(_config.url) === 0) return _originalFetch.apply(this, arguments);

      return _originalFetch.apply(this, arguments).then(function (response) {
        var duration = Math.round(performance.now() - start);

        _enqueueMetric('api_response_time_ms', duration, {
          url: url.substring(0, 200),
          method: method,
          status: response.status,
        });

        if (!response.ok) {
          _enqueueLog('warn', 'API call failed: ' + method + ' ' + url, {
            status: response.status,
            statusText: response.statusText,
            duration_ms: duration,
            type: 'api_error',
          });
        }

        _log('fetch intercepted', method + ' ' + url + ' → ' + response.status + ' (' + duration + 'ms)');
        return response;
      }).catch(function (err) {
        var duration = Math.round(performance.now() - start);
        _enqueueLog('error', 'API network error: ' + method + ' ' + url, {
          error: err.message,
          duration_ms: duration,
          type: 'network_error',
        });
        throw err; // Re-throw so the app's own error handling still works
      });
    };

    _log('fetch interceptor hooked');
  }

  function _hookXHR() {
    var _OriginalXHR = window.XMLHttpRequest;
    if (!_OriginalXHR) return;

    window.XMLHttpRequest = function () {
      var xhr = new _OriginalXHR();
      var _method = 'GET';
      var _url = '';
      var _start = 0;

      var _originalOpen = xhr.open;
      xhr.open = function (method, url) {
        _method = method;
        _url = url;
        _start = performance.now();
        return _originalOpen.apply(xhr, arguments);
      };

      xhr.addEventListener('load', function () {
        // Don't intercept our own SDK calls
        if (_url.indexOf(_config.url) === 0) return;

        var duration = Math.round(performance.now() - _start);
        _enqueueMetric('api_response_time_ms', duration, {
          url: _url.substring(0, 200),
          method: _method,
          status: xhr.status,
        });

        if (xhr.status >= 400) {
          _enqueueLog('warn', 'XHR failed: ' + _method + ' ' + _url, {
            status: xhr.status,
            duration_ms: duration,
            type: 'xhr_error',
          });
        }
      });

      xhr.addEventListener('error', function () {
        if (_url.indexOf(_config.url) === 0) return;
        _enqueueLog('error', 'XHR network error: ' + _method + ' ' + _url, {
          type: 'xhr_network_error',
        });
      });

      return xhr;
    };

    // Preserve prototype chain for instanceof checks
    window.XMLHttpRequest.prototype = _OriginalXHR.prototype;

    _log('XHR interceptor hooked');
  }

  function _hookNavigation() {
    // Track SPA navigation (Angular, React Router, Vue Router, etc.)
    window.addEventListener('popstate', function () {
      _enqueueLog('info', 'Page navigated (popstate)', {
        url: location.href,
        type: 'navigation',
      });
      _enqueueMetric('page_navigation', 1, { url: location.pathname });
    });

    window.addEventListener('hashchange', function (evt) {
      _enqueueLog('info', 'Page navigated (hashchange)', {
        oldUrl: evt.oldURL,
        newUrl: evt.newURL,
        type: 'navigation',
      });
    });

    // Intercept pushState/replaceState for framework routers
    var _origPush = history.pushState;
    var _origReplace = history.replaceState;

    history.pushState = function () {
      _origPush.apply(this, arguments);
      _enqueueLog('info', 'Page navigated', {
        url: location.href,
        type: 'navigation',
      });
      _enqueueMetric('page_navigation', 1, { url: location.pathname });
      _log('pushState navigation', location.pathname);
    };

    history.replaceState = function () {
      _origReplace.apply(this, arguments);
      _log('replaceState navigation', location.pathname);
    };

    _log('navigation tracking hooked');
  }

  function _hookPageLoad() {
    window.addEventListener('load', function () {
      // Use the Performance Timing API if available
      setTimeout(function () {
        var perf = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];

        if (perf) {
          _enqueueMetric('page_load_ms', Math.round(perf.loadEventEnd - perf.startTime), {
            page: location.pathname,
          });
          _enqueueMetric('dom_content_loaded_ms', Math.round(perf.domContentLoadedEventEnd - perf.startTime), {
            page: location.pathname,
          });
          _enqueueMetric('dns_lookup_ms', Math.round(perf.domainLookupEnd - perf.domainLookupStart));
          _enqueueMetric('tcp_connect_ms', Math.round(perf.connectEnd - perf.connectStart));
          _enqueueMetric('ttfb_ms', Math.round(perf.responseStart - perf.requestStart), {
            page: location.pathname,
          });
        } else {
          // Fallback: simple load time measurement
          _enqueueMetric('page_load_ms', Date.now() - _pageLoadStart, {
            page: location.pathname,
          });
        }

        _enqueueLog('info', 'Page loaded: ' + location.pathname, {
          url: location.href,
          referrer: document.referrer || 'direct',
          type: 'page_load',
        });

        _log('page load metrics captured');
      }, 100); // Small delay to ensure loadEventEnd is populated
    });
  }

  function _hookPageUnload() {
    // Flush any remaining data when the user leaves
    window.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        _flush();
      }
    });

    window.addEventListener('beforeunload', function () {
      _flush();
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────

  var SDK = {

    /**
     * Initialize the SDK. Call this once when your app starts.
     * @param {Object} options
     * @param {string} options.url       - Ingestion API URL (default: http://localhost:4000)
     * @param {string} options.service   - Your app name (e.g. 'mandi-frontend')
     * @param {string} [options.env]     - Environment tag (default: 'production')
     * @param {number} [options.flushInterval] - Ms between sends (default: 5000)
     * @param {boolean} [options.autoTrack]    - Auto-hook errors/fetch/nav (default: true)
     * @param {boolean} [options.debug]        - Log SDK activity to console (default: false)
     */
    init: function (options) {
      if (_initialized) { _log('already initialized, ignoring duplicate init()'); return; }

      Object.assign(_config, options || {});
      _initialized = true;

      _log('initializing', _config);

      // Start the periodic flush timer
      _flushTimer = setInterval(_flush, _config.flushInterval);

      // Hook automatic trackers
      if (_config.autoTrack) {
        _hookErrors();
        _hookFetch();
        _hookXHR();
        _hookNavigation();
        _hookPageLoad();
        _hookPageUnload();
      }

      _enqueueLog('info', 'Observability SDK initialized', {
        sdkVersion: '1.0.0',
        type: 'sdk_init',
      });

      console.log(
        '%c[Observability SDK]%c initialized — sending to ' + _config.url,
        'color: #10b981; font-weight: bold;',
        'color: inherit;'
      );
    },

    // ── Manual Metric Tracking ──────────────────────────────────────────

    /**
     * Track a numeric metric.
     * @param {string} name  - Metric name (e.g. 'checkout_total', 'items_in_cart')
     * @param {number} value - Numeric value
     * @param {Object} [tags] - Optional key-value tags
     */
    metric: function (name, value, tags) {
      if (!_initialized) { console.warn('[observability-sdk] call init() first'); return; }
      _enqueueMetric(name, value, tags);
    },

    // ── Manual Log Tracking ─────────────────────────────────────────────

    info:  function (message, meta) { _enqueueLog('info',  message, meta); },
    warn:  function (message, meta) { _enqueueLog('warn',  message, meta); },
    error: function (message, meta) { _enqueueLog('error', message, meta); },
    debug: function (message, meta) { _enqueueLog('debug', message, meta); },

    // ── User Action Tracking ────────────────────────────────────────────

    /**
     * Track a user action (button click, form submit, etc.)
     * @param {string} action - Action name (e.g. 'add_to_cart', 'login', 'search')
     * @param {Object} [details] - Optional details
     */
    trackAction: function (action, details) {
      _enqueueLog('info', 'User action: ' + action, Object.assign({
        type: 'user_action',
        action: action,
      }, details || {}));
      _enqueueMetric('user_action', 1, { action: action });
      _log('action tracked', action);
    },

    // ── Utilities ───────────────────────────────────────────────────────

    /** Force an immediate flush of the queue */
    flush: _flush,

    /** Stop the SDK and flush remaining data */
    destroy: function () {
      if (_flushTimer) clearInterval(_flushTimer);
      _flush();
      _initialized = false;
      _log('destroyed');
    },

    /** Get current queue sizes (useful for debugging) */
    status: function () {
      return {
        initialized: _initialized,
        config: { url: _config.url, service: _config.service },
        queuedMetrics: _queue.metrics.length,
        queuedLogs: _queue.logs.length,
      };
    },
  };

  // ── Export (UMD pattern: works as global, CommonJS, and ES module) ──

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SDK;                          // CommonJS / Node
  }

  root.ObservabilitySDK = SDK;                     // Global (script tag)

})(typeof window !== 'undefined' ? window : globalThis);
