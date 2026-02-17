/**
 * Sangati Intelligence — Pattern Detector
 *
 * Recognizes recurring service pressure patterns from alert history.
 * Example: "Every Friday at 19:30, entry queue builds for 15 minutes."
 *
 * Uses a simple frequency-based model: if the same rule fires at the same
 * hour+dayOfWeek in >60% of observations, it's a recognized pattern.
 *
 * Depends on: Core (PatternProvider interface)
 * Never imported by Core.
 */

import type { PatternProvider, PatternMatch } from '../core/providers';
import type { Alert, RestaurantState } from '../core/types';

interface PatternBucket {
  ruleId: string;
  dayOfWeek: number;
  hourOfDay: number;
  occurrences: number;
  totalWeeks: number;
  lastSeen: Date;
}

export class PatternDetectorProvider implements PatternProvider {
  private buckets: Map<string, PatternBucket> = new Map();
  private weekTracker: Set<string> = new Set(); // Track which weeks we've seen data for

  recordAlert(alert: Alert, state: RestaurantState): void {
    const key = this.bucketKey(alert.definitionId, state.timestamp);
    const weekKey = this.weekKey(state.timestamp);

    const existing = this.buckets.get(key);
    if (existing) {
      // Only count once per week for the same pattern
      const alertWeekKey = `${key}:${weekKey}`;
      if (!this.weekTracker.has(alertWeekKey)) {
        existing.occurrences++;
        this.weekTracker.add(alertWeekKey);
      }
      existing.lastSeen = state.timestamp;
    } else {
      this.buckets.set(key, {
        ruleId: alert.definitionId,
        dayOfWeek: state.timestamp.getDay(),
        hourOfDay: state.timestamp.getHours(),
        occurrences: 1,
        totalWeeks: 1,
        lastSeen: state.timestamp,
      });
      this.weekTracker.add(`${key}:${weekKey}`);
    }
  }

  getActivePatterns(state: RestaurantState): PatternMatch[] {
    const currentDay = state.timestamp.getDay();
    const currentHour = state.timestamp.getHours();
    const matches: PatternMatch[] = [];

    for (const [, bucket] of this.buckets) {
      // Match current day+hour
      if (bucket.dayOfWeek !== currentDay || bucket.hourOfDay !== currentHour) continue;

      // Need at least 3 occurrences
      if (bucket.occurrences < 3) continue;

      const confidence = Math.min(1.0, bucket.occurrences / Math.max(bucket.totalWeeks, 1));
      if (confidence < 0.5) continue;

      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][bucket.dayOfWeek];

      matches.push({
        patternId: `pattern_${bucket.ruleId}_${bucket.dayOfWeek}_${bucket.hourOfDay}`,
        description: `${bucket.ruleId} typically fires on ${dayName} around ${bucket.hourOfDay}:00`,
        confidence,
        recommendation: `Prepare for ${bucket.ruleId} — this is a recurring pattern (${Math.round(confidence * 100)}% confidence)`,
      });
    }

    return matches;
  }

  /** Advance the week counter. Call once per week. */
  advanceWeek(): void {
    for (const [, bucket] of this.buckets) {
      bucket.totalWeeks++;
    }
  }

  /** Get all patterns for diagnostics. */
  getAllPatterns(): PatternBucket[] {
    return Array.from(this.buckets.values());
  }

  private bucketKey(ruleId: string, timestamp: Date): string {
    return `${ruleId}:${timestamp.getDay()}:${timestamp.getHours()}`;
  }

  private weekKey(timestamp: Date): string {
    const startOfYear = new Date(timestamp.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((timestamp.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
    );
    return `${timestamp.getFullYear()}-W${weekNum}`;
  }
}
