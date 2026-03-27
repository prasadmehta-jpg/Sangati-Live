/**
 * Sangati — Core Rules Engine
 *
 * Evaluates rules against current restaurant state.
 * Handles suppression (cooldown, dedup, fatigue) and escalation (timer-based).
 *
 * Extension model:
 *   Core works standalone with zero providers.
 *   Intelligence modules register providers via the constructor.
 *   Feature flags gate whether providers are consulted.
 */

import type {
  RestaurantState,
  ZoneSnapshot,
  Alert,
  RecipientRole,
  ZoneConfig,
} from './types';
import type { Rule, RuleCondition } from './rules';
import type { Providers } from './providers';
import { FeatureFlagManager, type FeatureFlags } from './features';

// --- Internal Tracking ---

interface CooldownEntry {
  ruleId: string;
  dedupeKey: string;
  expiresAt: Date;
}

interface FatigueEntry {
  recipient: RecipientRole;
  timestamp: Date;
}

interface EscalationEntry {
  alertId: string;
  escalateAt: Date;
  escalateTo: RecipientRole;
  currentTier: number;
  originalAlert: Alert;
}

// --- Engine Configuration ---

export interface EngineConfig {
  rules: Rule[];
  zoneConfigs: ZoneConfig[];
  providers?: Partial<Providers>;
  featureFlags?: FeatureFlags;
}

// --- Engine ---

export class RulesEngine {
  private rules: Rule[];
  private cooldowns: CooldownEntry[] = [];
  private fatigueLog: FatigueEntry[] = [];
  private activeDedupeKeys: Set<string> = new Set();
  private escalationQueue: EscalationEntry[] = [];
  private recentAlerts: Alert[] = [];
  private alertCounter = 0;
  private zoneConfigs: Map<string, ZoneConfig>;
  private providers: Partial<Providers>;
  private features: FeatureFlagManager;

  constructor(config: EngineConfig);
  constructor(rules: Rule[], zoneConfigs: ZoneConfig[]);
  constructor(
    configOrRules: EngineConfig | Rule[],
    zoneConfigs?: ZoneConfig[],
  ) {
    if (Array.isArray(configOrRules)) {
      // Legacy constructor: RulesEngine(rules, zoneConfigs)
      this.rules = configOrRules;
      this.zoneConfigs = new Map((zoneConfigs ?? []).map((z) => [z.id, z]));
      this.providers = {};
      this.features = new FeatureFlagManager();
    } else {
      // New constructor: RulesEngine(config)
      this.rules = configOrRules.rules;
      this.zoneConfigs = new Map(configOrRules.zoneConfigs.map((z) => [z.id, z]));
      this.providers = configOrRules.providers ?? {};
      this.features = new FeatureFlagManager(configOrRules.featureFlags);
    }
  }

  /** Access the feature flag manager. */
  getFeatures(): FeatureFlagManager {
    return this.features;
  }

  /**
   * Evaluate all rules against current restaurant state.
   * Returns new alerts (already suppression-filtered).
   */
  evaluate(state: RestaurantState): Alert[] {
    if (state.mode === 'OFF') return [];

    const now = state.timestamp;
    this.pruneExpired(now);

    const alerts: Alert[] = [];

    for (const [zoneId, zoneSnapshot] of state.zones) {
      // Skip muted zones
      const muteExpiry = state.mutedZones.get(zoneId);
      if (muteExpiry && muteExpiry > now) continue;

      for (const rule of this.rules) {
        if (!rule.enabled) continue;
        if (!rule.modes.includes(state.mode as 'FULL' | 'QUIET')) continue;

        // Check zone type filter
        const zoneConfig = this.zoneConfigs.get(zoneId);
        if (rule.condition.zoneTypes && zoneConfig) {
          if (!rule.condition.zoneTypes.includes(zoneConfig.type)) continue;
        }

        // Evaluate condition (with optional threshold adjustment)
        if (!this.matchCondition(rule, zoneId, zoneSnapshot, state)) continue;

        // Build dedup key
        const dedupeKey = this.buildDedupeKey(rule.suppression.dedupeKey, zoneId, rule.id);

        // Check cooldown
        if (this.isOnCooldown(dedupeKey, now)) continue;

        // Check dedup (active alert with same key)
        if (this.activeDedupeKeys.has(dedupeKey)) continue;

        // Check fatigue
        if (this.isFatigued(rule.action.recipient, rule.suppression, now)) continue;

        // Intelligence: smart suppression check
        if (this.shouldSmartSuppress(rule, zoneId, zoneSnapshot, state)) continue;

        // All checks passed — generate alert
        const alert = this.createAlert(rule, zoneId, zoneSnapshot, dedupeKey, now);

        // Intelligence: anomaly scoring enrichment
        this.enrichWithAnomalyScore(alert, zoneSnapshot, state);

        alerts.push(alert);

        // Track suppression state
        this.cooldowns.push({
          ruleId: rule.id,
          dedupeKey,
          expiresAt: new Date(now.getTime() + rule.suppression.cooldownSeconds * 1000),
        });
        this.activeDedupeKeys.add(dedupeKey);
        this.fatigueLog.push({ recipient: rule.action.recipient, timestamp: now });
        this.recentAlerts.push(alert);

        // Intelligence: record for pattern learning
        this.recordForPatterns(alert, state);

        // Set up escalation if configured
        if (rule.action.escalateAfterSeconds && rule.action.escalateTo) {
          this.escalationQueue.push({
            alertId: alert.id,
            escalateAt: new Date(now.getTime() + rule.action.escalateAfterSeconds * 1000),
            escalateTo: rule.action.escalateTo,
            currentTier: 1,
            originalAlert: alert,
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Check for escalations that should fire at the given time.
   * Returns escalated alerts.
   */
  checkEscalations(now: Date): Alert[] {
    const escalated: Alert[] = [];
    const remaining: EscalationEntry[] = [];

    for (const entry of this.escalationQueue) {
      if (now >= entry.escalateAt) {
        const escalatedAlert: Alert = {
          ...entry.originalAlert,
          id: `alert_${++this.alertCounter}_esc`,
          recipient: entry.escalateTo,
          escalationTier: entry.currentTier + 1,
          state: 'escalated',
          text: `⬆ ${entry.originalAlert.text} (escalated)`,
          createdAt: now,
        };
        escalated.push(escalatedAlert);

        // Set up next tier escalation (captain → manager → all)
        const nextTier = this.getNextEscalationTier(entry.escalateTo);
        if (nextTier) {
          remaining.push({
            alertId: escalatedAlert.id,
            escalateAt: new Date(now.getTime() + 120 * 1000),
            escalateTo: nextTier,
            currentTier: entry.currentTier + 1,
            originalAlert: entry.originalAlert,
          });
        }
      } else {
        remaining.push(entry);
      }
    }

    this.escalationQueue = remaining;
    return escalated;
  }

  /** Acknowledge an alert — removes it from escalation queue. */
  acknowledgeAlert(alertId: string): void {
    this.escalationQueue = this.escalationQueue.filter(
      (e) => e.alertId !== alertId && e.originalAlert.id !== alertId
    );
  }

  /** Resolve an alert — removes dedup key and escalation. */
  resolveAlert(alert: Alert): void {
    this.activeDedupeKeys.delete(alert.dedupeKey);
    this.escalationQueue = this.escalationQueue.filter(
      (e) => e.alertId !== alert.id && e.originalAlert.id !== alert.id
    );
  }

  /** Get current suppression state for diagnostics. */
  getSuppressionState(): {
    activeCooldowns: number;
    activeDedupeKeys: number;
    pendingEscalations: number;
    fatigueLogSize: number;
  } {
    return {
      activeCooldowns: this.cooldowns.length,
      activeDedupeKeys: this.activeDedupeKeys.size,
      pendingEscalations: this.escalationQueue.length,
      fatigueLogSize: this.fatigueLog.length,
    };
  }

  // --- Private: Core Logic ---

  private matchCondition(
    rule: Rule,
    zoneId: string,
    zone: ZoneSnapshot,
    state: RestaurantState,
  ): boolean {
    const condition = rule.condition;

    // Zone state check
    if (condition.zoneState) {
      const states = Array.isArray(condition.zoneState)
        ? condition.zoneState
        : [condition.zoneState];
      if (!states.includes(zone.state)) return false;
    }

    // Duration check (with optional threshold adjustment)
    if (condition.minStateDuration !== undefined) {
      const threshold = this.adjustThreshold(
        rule.id, zoneId, 'minStateDuration', condition.minStateDuration, state,
      );
      if (zone.stateDurationSeconds < threshold) return false;
    }

    // Staff visit check (with optional threshold adjustment)
    if (condition.minSecondsSinceStaffVisit !== undefined) {
      const threshold = this.adjustThreshold(
        rule.id, zoneId, 'minSecondsSinceStaffVisit', condition.minSecondsSinceStaffVisit, state,
      );
      if (zone.secondsSinceStaffVisit < threshold) return false;
    }

    // Blob count check
    if (condition.minBlobCount !== undefined && zone.blobCount < condition.minBlobCount) {
      return false;
    }

    // Standing count check (with optional threshold adjustment)
    if (condition.minStandingCount !== undefined) {
      const threshold = this.adjustThreshold(
        rule.id, zoneId, 'minStandingCount', condition.minStandingCount, state,
      );
      if (zone.standingCount < threshold) return false;
    }

    // Occupancy ratio check
    if (condition.minOccupancyRatio !== undefined && zone.totalTables > 0) {
      const ratio = zone.occupiedTables / zone.totalTables;
      if (ratio < condition.minOccupancyRatio) return false;
    }

    // Custom predicate
    if (condition.custom && !condition.custom(zone, state)) {
      return false;
    }

    return true;
  }

  private buildDedupeKey(template: string, zoneId: string, ruleId: string): string {
    return template.replace('{zone_id}', zoneId).replace('{rule_id}', ruleId);
  }

  private isOnCooldown(dedupeKey: string, now: Date): boolean {
    return this.cooldowns.some((c) => c.dedupeKey === dedupeKey && c.expiresAt > now);
  }

  private isFatigued(
    recipient: RecipientRole,
    suppression: { fatigueLimit: number; fatigueWindowSeconds: number },
    now: Date,
  ): boolean {
    const windowStart = new Date(now.getTime() - suppression.fatigueWindowSeconds * 1000);
    const count = this.fatigueLog.filter(
      (f) => f.recipient === recipient && f.timestamp >= windowStart
    ).length;
    return count >= suppression.fatigueLimit;
  }

  private createAlert(
    rule: Rule,
    zoneId: string,
    zone: ZoneSnapshot,
    dedupeKey: string,
    now: Date,
  ): Alert {
    const zoneConfig = this.zoneConfigs.get(zoneId);
    const zoneName = zoneConfig?.name ?? zoneId;
    const durationMin = Math.floor(zone.stateDurationSeconds / 60);

    const text = rule.action.textTemplate
      .replace('{zone_name}', zoneName)
      .replace('{duration}', String(durationMin))
      .replace('{count}', String(zone.standingCount || zone.occupiedTables || zone.blobCount))
      .replace('{total}', String(zone.totalTables));

    return {
      id: `alert_${++this.alertCounter}`,
      definitionId: rule.action.alertDefinitionId,
      zoneId,
      severity: rule.action.severity,
      text,
      recipient: rule.action.recipient,
      escalationTier: 1,
      createdAt: now,
      state: 'new',
      dedupeKey,
    };
  }

  private getNextEscalationTier(currentRecipient: RecipientRole): RecipientRole | null {
    const ladder: Record<string, RecipientRole | null> = {
      server: 'captain',
      captain: 'manager',
      manager: 'all',
      all: null,
    };
    return ladder[currentRecipient] ?? null;
  }

  private pruneExpired(now: Date): void {
    this.cooldowns = this.cooldowns.filter((c) => c.expiresAt > now);

    // Prune fatigue log older than 10 minutes
    const cutoff = new Date(now.getTime() - 600 * 1000);
    this.fatigueLog = this.fatigueLog.filter((f) => f.timestamp >= cutoff);

    // Prune recent alerts older than 30 minutes (used by smart suppression)
    const alertCutoff = new Date(now.getTime() - 1800 * 1000);
    this.recentAlerts = this.recentAlerts.filter((a) => a.createdAt >= alertCutoff);
  }

  // --- Private: Intelligence Hooks (no-op when provider is absent or flag is off) ---

  private adjustThreshold(
    ruleId: string,
    zoneId: string,
    paramName: string,
    baseValue: number,
    state: RestaurantState,
  ): number {
    if (
      this.features.isEnabled('intelligence.adaptiveThresholds') &&
      this.providers.threshold
    ) {
      return this.providers.threshold.adjustThreshold(
        ruleId, zoneId, paramName, baseValue, state,
      );
    }
    return baseValue;
  }

  private shouldSmartSuppress(
    rule: Rule,
    zoneId: string,
    zone: ZoneSnapshot,
    state: RestaurantState,
  ): boolean {
    if (
      this.features.isEnabled('intelligence.smartSuppression') &&
      this.providers.suppression
    ) {
      return this.providers.suppression.shouldSuppress(
        rule, zoneId, zone, state, this.recentAlerts,
      );
    }
    return false;
  }

  private enrichWithAnomalyScore(
    alert: Alert,
    zone: ZoneSnapshot,
    state: RestaurantState,
  ): void {
    if (
      this.features.isEnabled('intelligence.anomalyScoring') &&
      this.providers.anomalyScoring
    ) {
      const score = this.providers.anomalyScoring.scoreZone(zone, state);
      // Upgrade severity if anomaly score is high
      if (score > 0.8 && alert.severity === 'medium') {
        alert.severity = 'high';
        alert.text = `[ANOMALY] ${alert.text}`;
      }
    }
  }

  private recordForPatterns(alert: Alert, state: RestaurantState): void {
    if (
      this.features.isEnabled('intelligence.patternDetection') &&
      this.providers.pattern
    ) {
      this.providers.pattern.recordAlert(alert, state);
    }
  }
}
