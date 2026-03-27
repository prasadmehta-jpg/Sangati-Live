/**
 * Sangati Intelligence — Smart Suppression
 *
 * Context-aware suppression that goes beyond Core's cooldown/dedup/fatigue.
 * Considers overall restaurant state to suppress alerts that would be
 * redundant or counterproductive.
 *
 * Example: suppress individual zone alerts when a broadcast "all hands"
 * alert is already active (the team is already mobilized).
 *
 * Depends on: Core (SuppressionProvider interface)
 * Never imported by Core.
 */

import type { SuppressionProvider } from '../core/providers';
import type { Alert, ZoneSnapshot, RestaurantState } from '../core/types';
import type { Rule } from '../core/rules';

export class SmartSuppressionProvider implements SuppressionProvider {
  shouldSuppress(
    rule: Rule,
    _zoneId: string,
    _zone: ZoneSnapshot,
    state: RestaurantState,
    recentAlerts: Alert[],
  ): boolean {
    // Rule 1: Suppress low/medium alerts if a broadcast (recipient: 'all') alert
    // was sent in the last 3 minutes. The team is already mobilized.
    if (rule.action.severity === 'low' || rule.action.severity === 'medium') {
      const threeMinAgo = new Date(state.timestamp.getTime() - 180 * 1000);
      const hasRecentBroadcast = recentAlerts.some(
        (a) => a.recipient === 'all' && a.createdAt >= threeMinAgo,
      );
      if (hasRecentBroadcast) return true;
    }

    // Rule 2: Suppress zone-level alerts if >3 alerts fired in the last 2 minutes
    // across all zones. System is in cascade mode — avoid alert storm.
    const twoMinAgo = new Date(state.timestamp.getTime() - 120 * 1000);
    const recentCount = recentAlerts.filter((a) => a.createdAt >= twoMinAgo).length;
    if (recentCount > 3 && rule.action.severity !== 'critical') {
      return true;
    }

    return false;
  }
}
