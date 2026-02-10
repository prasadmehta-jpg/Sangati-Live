import { useState, useEffect, useCallback, useRef } from 'react';
import { getDashboard } from '../lib/api';
import type { DashboardState } from '../types/domain';

interface UseDashboardResult {
  data: DashboardState | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useDashboard(intervalMs = 4000): UseDashboardResult {
  const [data, setData] = useState<DashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await getDashboard();
      setData(result);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    intervalRef.current = setInterval(fetchDashboard, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchDashboard, intervalMs]);

  return { data, error, loading, refresh: fetchDashboard };
}
