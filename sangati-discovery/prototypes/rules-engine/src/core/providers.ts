/**
 * Sangati — Core Provider Interfaces
 *
 * Extension points that Intelligence modules implement.
 * Core defines these; Core NEVER imports Intelligence.
 * Intelligence depends on Core, not the other way around.
 *
 * Design: each provider is optional. Core works with zero providers.
 * Providers are registered at engine construction time.
 */

import type { Alert, RestaurantState, ZoneSnapshot, RecipientRole } from './types';
import type { Rule } from './rules';

/**
 * Adjusts rule thresholds dynamically based on learned patterns.
 * Example: during known rush windows, lower the queue alert threshold
 * from 3 to 2 standing people.
 */
export interface ThresholdProvider {
  /** Adjust a numeric threshold for a specific rule+zone at a given time. */
  adjustThreshold(
    ruleId: string,
    zoneId: string,
    paramName: string,
    baseValue: number,
    state: RestaurantState,
  ): number;
}

/**
 * Scores zones for anomaly detection against learned baselines.
 * Returns 0.0 (normal) to 1.0 (highly anomalous).
 * Core can use this to boost alert severity or add context.
 */
export interface AnomalyScoringProvider {
  /** Score a zone snapshot against the learned baseline. */
  scoreZone(zone: ZoneSnapshot, state: RestaurantState): number;
}

/**
 * Provides additional suppression logic beyond Core's cooldown/dedup/fatigue.
 * Returns true if the alert should be suppressed.
 */
export interface SuppressionProvider {
  /** Return true to suppress this alert. */
  shouldSuppress(
    rule: Rule,
    zoneId: string,
    zone: ZoneSnapshot,
    state: RestaurantState,
    recentAlerts: Alert[],
  ): boolean;
}

/**
 * Detects recurring patterns (e.g., "every Friday 19:30 entry queue builds")
 * and provides recommendations.
 */
export interface PatternProvider {
  /** Record an alert event for pattern learning. */
  recordAlert(alert: Alert, state: RestaurantState): void;
  /** Get active pattern matches for the current state. */
  getActivePatterns(state: RestaurantState): PatternMatch[];
}

export interface PatternMatch {
  patternId: string;
  description: string;
  confidence: number; // 0.0 - 1.0
  recommendation: string;
}

/**
 * Aggregate of all provider slots.
 * Every field is optional — Core works with none of them.
 */
export interface Providers {
  threshold?: ThresholdProvider;
  anomalyScoring?: AnomalyScoringProvider;
  suppression?: SuppressionProvider;
  pattern?: PatternProvider;
}
