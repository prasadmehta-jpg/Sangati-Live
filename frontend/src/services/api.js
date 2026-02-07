/**
 * API client for Sangati backend.
 * All calls go through /api prefix, proxied in dev, served by FastAPI in production.
 */

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// Dashboard
export const getDashboard = () => request('/dashboard');

// Zones
export const getZones = () => request('/zones');
export const getZone = (id) => request(`/zones/${id}`);
export const updateZone = (id, data) =>
  request(`/zones/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const getPressureSummary = () => request('/zones/pressure/summary');

// Signals
export const getSignals = (minutes = 15, zoneId = null) => {
  let url = `/signals?minutes=${minutes}`;
  if (zoneId) url += `&zone_id=${zoneId}`;
  return request(url);
};
export const getActiveSignals = () => request('/signals/active');

// Decisions
export const getDecisions = (limit = 50) => request(`/decisions?limit=${limit}`);
export const getPendingDecisions = () => request('/decisions/pending');

// Nudges
export const getNudges = (role = null) => {
  let url = '/nudges';
  if (role) url += `?role=${role}`;
  return request(url);
};
export const nudgeAction = (id, action, actor = 'staff') =>
  request(`/nudges/${id}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, actor }),
  });

// Audit
export const getAuditLog = (limit = 100, eventType = null) => {
  let url = `/audit?limit=${limit}`;
  if (eventType) url += `&event_type=${eventType}`;
  return request(url);
};
export const getNudgeTrace = (nudgeId) => request(`/audit/trace/${nudgeId}`);

// Demo
export const getDemoStatus = () => request('/demo/status');
export const setScenario = (scenario) =>
  request('/demo/scenario', { method: 'POST', body: JSON.stringify({ scenario }) });
export const toggleDemo = (enabled) =>
  request('/demo/toggle', { method: 'POST', body: JSON.stringify({ enabled }) });
export const resetDemo = () => request('/demo/reset', { method: 'POST' });
export const manualTick = () => request('/demo/tick', { method: 'POST' });

// Health
export const healthCheck = () => request('/health');
