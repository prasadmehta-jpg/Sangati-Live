import { useState, useEffect, useCallback, useRef } from 'react';
import { getDashboard } from '../services/api';

/**
 * Hook to poll dashboard state on an interval.
 */
export function useDashboard(intervalMs = 3000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await getDashboard();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    intervalRef.current = setInterval(fetchDashboard, intervalMs);
    return () => clearInterval(intervalRef.current);
  }, [fetchDashboard, intervalMs]);

  return { data, error, loading, refresh: fetchDashboard };
}
