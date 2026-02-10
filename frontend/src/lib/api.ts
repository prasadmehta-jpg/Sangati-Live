import type {
  DashboardState,
  Zone,
  Signal,
  Decision,
  Nudge,
  AuditEvent,
  PressureSummary,
  PipelineResult,
  HealthStatus,
} from '../types/domain';

const BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_API_BASE) ||
  '/api';

const TIMEOUT_MS = 10_000;

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(
        res.status,
        (body as { detail?: string }).detail || `Request failed: ${res.status}`,
      );
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new ApiError(408, 'Request timed out');
    }
    throw new ApiError(0, (err as Error).message || 'Network error');
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// ---- Typed API methods ----

export const getDashboard = () => apiGet<DashboardState>('/dashboard');

export const getZones = () => apiGet<Zone[]>('/zones');
export const getZone = (id: number) => apiGet<Zone>(`/zones/${id}`);
export const updateZone = (id: number, data: { occupancy?: number; status?: string }) =>
  apiPatch<Zone>(`/zones/${id}`, data);
export const getPressureSummary = () =>
  apiGet<PressureSummary>('/zones/pressure/summary');

export const getSignals = (minutes = 15, zoneId?: number) => {
  let url = `/signals?minutes=${minutes}`;
  if (zoneId) url += `&zone_id=${zoneId}`;
  return apiGet<Signal[]>(url);
};
export const getActiveSignals = () => apiGet<Signal[]>('/signals/active');

export const getDecisions = (limit = 50) =>
  apiGet<Decision[]>(`/decisions?limit=${limit}`);
export const getPendingDecisions = () =>
  apiGet<Decision[]>('/decisions/pending');

export const getNudges = (role?: string) => {
  let url = '/nudges';
  if (role) url += `?role=${role}`;
  return apiGet<Nudge[]>(url);
};
export const nudgeAction = (id: number, action: string, actor = 'staff') =>
  apiPost<Nudge>(`/nudges/${id}/action`, { action, actor });

export const getAuditLog = (limit = 100, eventType?: string) => {
  let url = `/audit?limit=${limit}`;
  if (eventType) url += `&event_type=${eventType}`;
  return apiGet<AuditEvent[]>(url);
};
export const getNudgeTrace = (nudgeId: number) =>
  apiGet<AuditEvent[]>(`/audit/trace/${nudgeId}`);

export const triggerPipeline = () => apiPost<PipelineResult>('/pipeline/tick');

export const healthCheck = () => apiGet<HealthStatus>('/health');
