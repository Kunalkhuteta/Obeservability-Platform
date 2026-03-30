import axios from 'axios';

const api = axios.create({ baseURL: '/v1' });

export const MetricsAPI = {
  getSeries:    (name, range='1h', window='1m') =>
    api.get('/metrics/series', { params: { name, range, window } }).then(r => r.data),
  getLatest:    (names) =>
    api.get('/metrics/latest', { params: { names: names.join(',') } }).then(r => r.data),
  getAvailable: () => api.get('/metrics/available').then(r => r.data),
};

export const LogsAPI = {
  search:      (params) => api.get('/logs', { params }).then(r => r.data),
  getServices: ()       => api.get('/logs/services').then(r => r.data),
  getCounts:   ()       => api.get('/logs/counts').then(r => r.data),
};

export const AlertsAPI = {
  getRules:   ()       => api.get('/alerts').then(r => r.data),
  getHistory: ()       => api.get('/alerts/history').then(r => r.data),
  createRule: (rule)   => api.post('/alerts', rule).then(r => r.data),
  toggleRule: (id, en) => api.patch(`/alerts/${id}`, { enabled: en }).then(r => r.data),
};

export const SummaryAPI = {
  get: () => api.get('/summary').then(r => r.data),
};
