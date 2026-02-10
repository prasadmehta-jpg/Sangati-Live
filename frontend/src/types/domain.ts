export interface Zone {
  id: number;
  name: string;
  zone_type: string;
  capacity: number;
  current_occupancy: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  position_x: number;
  position_y: number;
  metadata_json: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface Signal {
  id: number;
  zone_id: number;
  signal_type: string;
  intensity: number;
  source: string;
  payload: Record<string, unknown> | null;
  is_demo: boolean;
  created_at: string | null;
}

export interface Decision {
  id: number;
  signal_ids: number[] | null;
  rule_name: string;
  rule_description: string;
  confidence: number;
  action_type: string;
  parameters: Record<string, unknown> | null;
  status: 'pending' | 'nudged' | 'acted' | 'expired' | 'dismissed';
  explanation: string;
  is_demo: boolean;
  created_at: string | null;
}

export interface Nudge {
  id: number;
  decision_id: number;
  zone_id: number | null;
  target_role: 'server' | 'host' | 'manager' | 'kitchen' | 'busser';
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  explanation: string;
  status: 'active' | 'acknowledged' | 'dismissed' | 'expired';
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  is_demo: boolean;
  created_at: string | null;
  expires_at: string | null;
}

export interface AuditEvent {
  id: number;
  event_type: string;
  entity_type: string | null;
  entity_id: number | null;
  actor: string;
  summary: string;
  details: Record<string, unknown> | null;
  trace_chain: unknown[] | null;
  is_demo: boolean;
  created_at: string | null;
}

export interface PressureSummary {
  total_zones: number;
  total_capacity: number;
  total_occupancy: number;
  occupancy_rate: number;
  occupied_tables: number;
  total_tables: number;
  table_utilization: number;
  zones_by_status: Record<string, number>;
}

export interface DashboardState {
  zones: Zone[];
  active_nudges: Nudge[];
  recent_signals: Signal[];
  recent_decisions: Decision[];
  pressure_summary: PressureSummary;
}

export interface PipelineResult {
  signals_generated: number;
  decisions_made: number;
  nudges_created: number;
  nudges_expired?: number;
}

export interface HealthStatus {
  status: string;
  app: string;
  version: string;
}

export type Role = 'server' | 'manager' | 'owner';
