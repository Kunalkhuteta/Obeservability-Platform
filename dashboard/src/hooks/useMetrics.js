import { useState, useEffect, useCallback } from 'react';
import { MetricsAPI, SummaryAPI } from '../api/client';

// Polls a metric series every 5s and returns chart-ready data
export function useMetricSeries(name, range = '15m', window = '10s') {
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
    const id = setInterval(fetch, 5_000); // real-time refresh every 5s
    return () => clearInterval(id);
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Polls latest metric values (for stat cards) every 3s
export function useLatestMetrics(names) {
  const [values,  setValues]  = useState({});
  const [loading, setLoading] = useState(true);
  const key = names.join(',');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await MetricsAPI.getLatest(names);
        setValues(res);
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
    const id = setInterval(fetch, 3_000);
    return () => clearInterval(id);
  }, [key]);

  return { values, loading };
}

// Polls summary every 5s
export function useSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = () =>
      SummaryAPI.get()
        .then(setSummary)
        .catch(() => {})
        .finally(() => setLoading(false));

    fetchSummary();
    const id = setInterval(fetchSummary, 5_000);
    return () => clearInterval(id);
  }, []);

  return { summary, loading };
}
