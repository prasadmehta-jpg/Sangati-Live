/**
 * Sangati — Core Rule Definitions
 *
 * Declarative rules evaluated against RestaurantState.
 * Each rule has a condition (predicate), an action (alert template),
 * and suppression config.
 */

import type {
  RestaurantState,
  ZoneSnapshot,
  ZoneType,
  Severity,
  RecipientRole,
} from './types';

// --- Rule Types ---

export interface RuleCondition {
  /** Zone states that trigger this rule */
  zoneState?: ZoneSnapshot['state'] | ZoneSnapshot['state'][];
  /** Minimum duration in current state (seconds) */
  minStateDuration?: number;
  /** Minimum seconds since staff was last in zone */
  minSecondsSinceStaffVisit?: number;
  /** Minimum blob count */
  minBlobCount?: number;
  /** Minimum standing blob count */
  minStandingCount?: number;
  /** Minimum occupancy ratio (occupiedTables / totalTables) */
  minOccupancyRatio?: number;
  /** Zone types this rule applies to */
  zoneTypes?: ZoneType[];
  /** Custom predicate for complex conditions */
  custom?: (zone: ZoneSnapshot, state: RestaurantState) => boolean;
}

export interface RuleAction {
  /** Alert definition ID from taxonomy */
  alertDefinitionId: string;
  /** Severity override (uses taxonomy default if not set) */
  severity: Severity;
  /** Alert text template. Supports {zone_name}, {duration}, {count} */
  textTemplate: string;
  /** Primary recipient role */
  recipient: RecipientRole;
  /** Escalation target */
  escalateTo: RecipientRole | null;
  /** Seconds before escalation */
  escalateAfterSeconds: number | null;
}

export interface SuppressionConfig {
  /** Cooldown in seconds — don't re-fire same rule+zone within this window */
  cooldownSeconds: number;
  /** Deduplication key template. Supports {zone_id}, {rule_id} */
  dedupeKey: string;
  /** Max alerts per recipient role per window */
  fatigueLimit: number;
  /** Fatigue window in seconds */
  fatigueWindowSeconds: number;
}

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  /** Only evaluate in these system modes */
  modes: ('FULL' | 'QUIET')[];
  condition: RuleCondition;
  action: RuleAction;
  suppression: SuppressionConfig;
}

// --- Default Rule Set ---

export const DEFAULT_RULES: Rule[] = [
  {
    id: 'rule_idle_table',
    name: 'Table idle too long',
    enabled: true,
    modes: ['FULL', 'QUIET'],
    condition: {
      zoneState: 'IDLE',
      minStateDuration: 480, // 8 minutes
      zoneTypes: ['dining'],
    },
    action: {
      alertDefinitionId: 'alert_idle_table',
      severity: 'medium',
      textTemplate: '{zone_name}: idle {duration}m, needs check',
      recipient: 'server',
      escalateTo: 'captain',
      escalateAfterSeconds: 90,
    },
    suppression: {
      cooldownSeconds: 300, // 5 min
      dedupeKey: '{zone_id}:idle_table',
      fatigueLimit: 5,
      fatigueWindowSeconds: 600,
    },
  },
  {
    id: 'rule_dirty_table',
    name: 'Dirty table not cleared',
    enabled: true,
    modes: ['FULL'],
    condition: {
      zoneState: 'DIRTY',
      minStateDuration: 240, // 4 minutes
      zoneTypes: ['dining'],
    },
    action: {
      alertDefinitionId: 'alert_dirty_table',
      severity: 'high',
      textTemplate: '{zone_name}: dirty {duration}m, clear now',
      recipient: 'server',
      escalateTo: 'captain',
      escalateAfterSeconds: 90,
    },
    suppression: {
      cooldownSeconds: 300,
      dedupeKey: '{zone_id}:dirty_table',
      fatigueLimit: 5,
      fatigueWindowSeconds: 600,
    },
  },
  {
    id: 'rule_queue_buildup',
    name: 'Entry queue building',
    enabled: true,
    modes: ['FULL', 'QUIET'],
    condition: {
      zoneState: 'QUEUE',
      minStateDuration: 120, // 2 minutes
      minStandingCount: 3,
      zoneTypes: ['entry'],
    },
    action: {
      alertDefinitionId: 'alert_queue_buildup',
      severity: 'high',
      textTemplate: 'Entry: {count} waiting {duration}m, seat guests',
      recipient: 'captain',
      escalateTo: 'manager',
      escalateAfterSeconds: 120,
    },
    suppression: {
      cooldownSeconds: 300,
      dedupeKey: '{zone_id}:queue',
      fatigueLimit: 3,
      fatigueWindowSeconds: 600,
    },
  },
  {
    id: 'rule_no_service',
    name: 'Table waiting for service',
    enabled: true,
    modes: ['FULL'],
    condition: {
      zoneState: 'OCCUPIED',
      minSecondsSinceStaffVisit: 360, // 6 minutes
      zoneTypes: ['dining'],
    },
    action: {
      alertDefinitionId: 'alert_no_service',
      severity: 'medium',
      textTemplate: '{zone_name}: no service {duration}m',
      recipient: 'server',
      escalateTo: 'captain',
      escalateAfterSeconds: 90,
    },
    suppression: {
      cooldownSeconds: 360,
      dedupeKey: '{zone_id}:no_service',
      fatigueLimit: 5,
      fatigueWindowSeconds: 600,
    },
  },
  {
    id: 'rule_zone_overload',
    name: 'Zone overload',
    enabled: true,
    modes: ['FULL', 'QUIET'],
    condition: {
      minOccupancyRatio: 0.8,
      zoneTypes: ['dining'],
      custom: (_zone, state) => {
        for (const [, z] of state.zones) {
          if (z.state === 'QUEUE') return true;
        }
        return false;
      },
    },
    action: {
      alertDefinitionId: 'alert_zone_overload',
      severity: 'high',
      textTemplate: '{zone_name}: {count}/{total} tables full + queue',
      recipient: 'manager',
      escalateTo: null,
      escalateAfterSeconds: null,
    },
    suppression: {
      cooldownSeconds: 600,
      dedupeKey: '{zone_id}:overload',
      fatigueLimit: 2,
      fatigueWindowSeconds: 600,
    },
  },
  {
    id: 'rule_long_wait',
    name: 'Excessive wait time',
    enabled: true,
    modes: ['FULL', 'QUIET'],
    condition: {
      zoneState: 'QUEUE',
      minStateDuration: 600, // 10 minutes
      zoneTypes: ['entry'],
    },
    action: {
      alertDefinitionId: 'alert_long_wait',
      severity: 'critical',
      textTemplate: 'Entry: guests waiting {duration}m!',
      recipient: 'manager',
      escalateTo: 'all',
      escalateAfterSeconds: 180,
    },
    suppression: {
      cooldownSeconds: 600,
      dedupeKey: '{zone_id}:long_wait',
      fatigueLimit: 2,
      fatigueWindowSeconds: 600,
    },
  },
];
