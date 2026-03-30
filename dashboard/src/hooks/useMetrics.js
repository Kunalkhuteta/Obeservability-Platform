import { useState, useEffect, useCallback } from 'react';
import { MetricsAPI, SummaryAPI } from '../api/client';

// Polls a metric series every 30s and returns chart-ready data
export function useMetricSeries(name, range = '1h', window = '1m') {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    try {
      const res = await MetricsAPI.getSeries(name, range, window);
      setData(res.points);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [name, range, window]);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, 30_000); // refresh every 30s
    return () => clearInterval(id);
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Polls latest metric values (for stat cards) every 10s
export function useLatestMetrics(names) {
  const [values,  setValues]  = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await MetricsAPI.getLatest(names);
        setValues(res);
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
    const id = setInterval(fetch, 10_000);
    return () => clearInterval(id);
  }, [names.join(',')]);

  return { values, loading };
}

// One-shot summary fetch
export function useSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SummaryAPI.get().then(setSummary).finally(() => setLoading(false));
    const id = setInterval(() => SummaryAPI.get().then(setSummary), 15_000);
    return () => clearInterval(id);
  }, []);

  return { summary, loading };
}
