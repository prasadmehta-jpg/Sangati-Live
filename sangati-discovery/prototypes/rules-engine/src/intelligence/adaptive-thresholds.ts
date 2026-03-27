/**
 * Sangati Intelligence — Adaptive Thresholds
 *
 * Learns from alert history to adjust rule thresholds per zone and time window.
 * Example: if a zone consistently triggers idle alerts at 480s but staff
 * typically respond at 500s, raise the threshold to reduce false positives.
 *
 * Depends on: Core (ThresholdProvider interface)
 * Never imported by Core.
 */

import type { ThresholdProvider } from '../core/providers';
import type { RestaurantState } from '../core/types';

interface ThresholdRecord {
  ruleId: string;
  zoneId: string;
  paramName: string;
  value: number;
  timestamp: Date;
  wasUseful: boolean; // Was the alert acknowledged (not snoozed/overridden)?
}

export class AdaptiveThresholdProvider implements ThresholdProvider {
  private history: ThresholdRecord[] = [];
  private adjustments: Map<string, number> = new Map();
  private readonly maxHistory = 500;
  private readonly learningRate = 0.1;

  adjustThreshold(
    ruleId: string,
    zoneId: string,
    paramName: string,
    baseValue: number,
    _state: RestaurantState,
  ): number {
    const key = `${ruleId}:${zoneId}:${paramName}`;
    const adjustment = this.adjustments.get(key);
    if (adjustment !== undefined) {
      return Math.max(1, Math.round(baseValue * adjustment));
    }
    return baseValue;
  }

  /**
   * Feed back whether an alert was useful (acknowledged) or not (snoozed/overridden).
   * Call this after alert lifecycle completes.
   */
  recordOutcome(
    ruleId: string,
    zoneId: string,
    paramName: string,
    thresholdUsed: number,
    wasUseful: boolean,
    timestamp: Date,
  ): void {
    this.history.push({ ruleId, zoneId, paramName, value: thresholdUsed, timestamp, wasUseful });

    // Prune old history
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    // Recalculate adjustment
    this.recalculate(ruleId, zoneId, paramName);
  }

  private recalculate(ruleId: string, zoneId: string, paramName: string): void {
    const key = `${ruleId}:${zoneId}:${paramName}`;
    const relevant = this.history.filter(
      (r) => r.ruleId === ruleId && r.zoneId === zoneId && r.paramName === paramName,
    );

    if (relevant.length < 5) {
      // Not enough data to adjust
      this.adjustments.delete(key);
      return;
    }

    const usefulRate = relevant.filter((r) => r.wasUseful).length / relevant.length;

    if (usefulRate < 0.3) {
      // Mostly false positives — raise threshold (fewer alerts)
      const current = this.adjustments.get(key) ?? 1.0;
      this.adjustments.set(key, current + this.learningRate);
    } else if (usefulRate > 0.8) {
      // Mostly useful — slightly lower threshold (catch more)
      const current = this.adjustments.get(key) ?? 1.0;
      this.adjustments.set(key, Math.max(0.5, current - this.learningRate * 0.5));
    }
    // 0.3–0.8 = healthy range, no adjustment
  }

  /** Get current adjustments for diagnostics. */
  getAdjustments(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of this.adjustments) {
      result[key] = value;
    }
    return result;
  }
}
