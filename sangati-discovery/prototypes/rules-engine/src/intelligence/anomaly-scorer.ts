/**
 * Sangati Intelligence — Anomaly Scorer
 *
 * Scores zone states against learned baselines using a simple
 * sliding-window statistical model. A score > 0.8 indicates the
 * zone is in an unusual state for this time of day / day of week.
 *
 * Depends on: Core (AnomalyScoringProvider interface)
 * Never imported by Core.
 */

import type { AnomalyScoringProvider } from '../core/providers';
import type { ZoneSnapshot, RestaurantState } from '../core/types';

interface BaselineEntry {
  zoneId: string;
  hourOfDay: number;
  dayOfWeek: number;
  avgBlobCount: number;
  avgOccupancy: number;
  avgStateDuration: number;
  sampleCount: number;
}

export class AnomalyScoringProvider_ implements AnomalyScoringProvider {
  private baselines: Map<string, BaselineEntry> = new Map();
  private readonly minSamples = 10;

  scoreZone(zone: ZoneSnapshot, state: RestaurantState): number {
    const key = this.baselineKey(zone.zoneId, state.timestamp);
    const baseline = this.baselines.get(key);

    if (!baseline || baseline.sampleCount < this.minSamples) {
      return 0.0; // Not enough data — assume normal
    }

    // Score based on deviation from baseline
    const deviations: number[] = [];

    if (baseline.avgBlobCount > 0) {
      deviations.push(
        Math.abs(zone.blobCount - baseline.avgBlobCount) / Math.max(baseline.avgBlobCount, 1),
      );
    }

    if (baseline.avgOccupancy > 0 && zone.totalTables > 0) {
      const currentOccupancy = zone.occupiedTables / zone.totalTables;
      deviations.push(Math.abs(currentOccupancy - baseline.avgOccupancy));
    }

    if (baseline.avgStateDuration > 0) {
      deviations.push(
        Math.abs(zone.stateDurationSeconds - baseline.avgStateDuration) /
          Math.max(baseline.avgStateDuration, 1),
      );
    }

    if (deviations.length === 0) return 0.0;

    // Average deviation, clamped to 0–1
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    return Math.min(1.0, avgDeviation);
  }

  /**
   * Record a zone observation to build the baseline.
   * Call this on every evaluation cycle, not just when alerts fire.
   */
  recordObservation(zone: ZoneSnapshot, state: RestaurantState): void {
    const key = this.baselineKey(zone.zoneId, state.timestamp);
    const existing = this.baselines.get(key);

    if (existing) {
      const n = existing.sampleCount;
      existing.avgBlobCount = (existing.avgBlobCount * n + zone.blobCount) / (n + 1);
      existing.avgStateDuration =
        (existing.avgStateDuration * n + zone.stateDurationSeconds) / (n + 1);
      if (zone.totalTables > 0) {
        const occupancy = zone.occupiedTables / zone.totalTables;
        existing.avgOccupancy = (existing.avgOccupancy * n + occupancy) / (n + 1);
      }
      existing.sampleCount = n + 1;
    } else {
      this.baselines.set(key, {
        zoneId: zone.zoneId,
        hourOfDay: state.timestamp.getHours(),
        dayOfWeek: state.timestamp.getDay(),
        avgBlobCount: zone.blobCount,
        avgOccupancy: zone.totalTables > 0 ? zone.occupiedTables / zone.totalTables : 0,
        avgStateDuration: zone.stateDurationSeconds,
        sampleCount: 1,
      });
    }
  }

  /** Get baseline data for diagnostics. */
  getBaselines(): BaselineEntry[] {
    return Array.from(this.baselines.values());
  }

  private baselineKey(zoneId: string, timestamp: Date): string {
    return `${zoneId}:${timestamp.getDay()}:${timestamp.getHours()}`;
  }
}
