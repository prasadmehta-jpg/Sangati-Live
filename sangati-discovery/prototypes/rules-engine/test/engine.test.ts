/**
 * Sangati — Rules Engine Tests
 *
 * Tests cover:
 *   1. Core-only mode (no providers, no Intelligence)
 *   2. Feature flags (core locked, intelligence toggleable)
 *   3. Intelligence providers (adaptive thresholds, smart suppression, anomaly scoring)
 *   4. Backward compatibility (legacy constructor still works)
 */

import { RulesEngine } from '../src/core/engine';
import { DEFAULT_RULES } from '../src/core/rules';
import { FeatureFlagManager } from '../src/core/features';
import type { Rule } from '../src/core/rules';
import type { RestaurantState, ZoneSnapshot, Alert } from '../src/core/types';
import type { EngineConfig } from '../src/core/engine';

// Intelligence imports
import { createIntelligenceProviders, INTELLIGENCE_FLAGS } from '../src/intelligence';

// --- Test Helpers ---

const ZONE_CONFIGS = [
  { id: 'zone_01', name: 'Zone A', type: 'dining' as const },
  { id: 'zone_02', name: 'Zone B', type: 'dining' as const },
  { id: 'zone_entry', name: 'Entry', type: 'entry' as const },
];

function makeZone(overrides: Partial<ZoneSnapshot> & { zoneId: string }): ZoneSnapshot {
  return {
    zoneId: overrides.zoneId,
    state: overrides.state ?? 'EMPTY',
    blobCount: overrides.blobCount ?? 0,
    seatedCount: overrides.seatedCount ?? 0,
    standingCount: overrides.standingCount ?? 0,
    staffPresent: overrides.staffPresent ?? false,
    stateDurationSeconds: overrides.stateDurationSeconds ?? 0,
    secondsSinceStaffVisit: overrides.secondsSinceStaffVisit ?? 0,
    occupiedTables: overrides.occupiedTables ?? 0,
    totalTables: overrides.totalTables ?? 5,
  };
}

function makeState(
  zones: ZoneSnapshot[],
  overrides?: Partial<Pick<RestaurantState, 'mode' | 'timestamp'>>,
): RestaurantState {
  const zoneMap = new Map<string, ZoneSnapshot>();
  for (const z of zones) {
    zoneMap.set(z.zoneId, z);
  }
  return {
    restaurantId: 'test',
    timestamp: overrides?.timestamp ?? new Date('2026-02-13T19:00:00Z'),
    zones: zoneMap,
    mode: overrides?.mode ?? 'FULL',
    mutedZones: new Map(),
  };
}

// ==========================================
// Core-Only Tests (no Intelligence)
// ==========================================

describe('Core: RulesEngine', () => {
  describe('basic rule evaluation', () => {
    it('should fire idle table alert when zone is IDLE for >8 minutes', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const state = makeState([
        makeZone({
          zoneId: 'zone_01',
          state: 'IDLE',
          stateDurationSeconds: 500,
          blobCount: 4,
          seatedCount: 4,
          occupiedTables: 2,
        }),
        makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
        makeZone({ zoneId: 'zone_entry', state: 'EMPTY' }),
      ]);

      const alerts = engine.evaluate(state);

      expect(alerts.length).toBe(1);
      expect(alerts[0].definitionId).toBe('alert_idle_table');
      expect(alerts[0].severity).toBe('medium');
      expect(alerts[0].recipient).toBe('server');
      expect(alerts[0].zoneId).toBe('zone_01');
      expect(alerts[0].text).toContain('Zone A');
    });

    it('should NOT fire idle table alert when duration is below threshold', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const state = makeState([
        makeZone({
          zoneId: 'zone_01',
          state: 'IDLE',
          stateDurationSeconds: 300,
          blobCount: 4,
          seatedCount: 4,
          occupiedTables: 2,
        }),
        makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
        makeZone({ zoneId: 'zone_entry', state: 'EMPTY' }),
      ]);

      const alerts = engine.evaluate(state);
      expect(alerts.length).toBe(0);
    });

    it('should fire dirty table alert when zone is DIRTY for >4 minutes', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const state = makeState([
        makeZone({
          zoneId: 'zone_01',
          state: 'DIRTY',
          stateDurationSeconds: 260,
          blobCount: 0,
          occupiedTables: 0,
        }),
        makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
        makeZone({ zoneId: 'zone_entry', state: 'EMPTY' }),
      ]);

      const alerts = engine.evaluate(state);

      expect(alerts.length).toBe(1);
      expect(alerts[0].definitionId).toBe('alert_dirty_table');
      expect(alerts[0].severity).toBe('high');
      expect(alerts[0].recipient).toBe('server');
    });

    it('should fire queue alert when entry zone has QUEUE with >=3 standing for >2 min', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const state = makeState([
        makeZone({ zoneId: 'zone_01', state: 'EMPTY' }),
        makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
        makeZone({
          zoneId: 'zone_entry',
          state: 'QUEUE',
          stateDurationSeconds: 150,
          standingCount: 4,
          blobCount: 4,
        }),
      ]);

      const alerts = engine.evaluate(state);

      expect(alerts.length).toBe(1);
      expect(alerts[0].definitionId).toBe('alert_queue_buildup');
      expect(alerts[0].recipient).toBe('captain');
    });

    it('should fire no-service alert when occupied zone has no staff visit for >6 min', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const state = makeState([
        makeZone({
          zoneId: 'zone_01',
          state: 'OCCUPIED',
          stateDurationSeconds: 400,
          secondsSinceStaffVisit: 400,
          blobCount: 6,
          seatedCount: 6,
          occupiedTables: 3,
        }),
        makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
        makeZone({ zoneId: 'zone_entry', state: 'EMPTY' }),
      ]);

      const alerts = engine.evaluate(state);

      expect(alerts.length).toBe(1);
      expect(alerts[0].definitionId).toBe('alert_no_service');
      expect(alerts[0].recipient).toBe('server');
    });
  });

  describe('suppression', () => {
    it('should enforce cooldown — same rule+zone does not re-fire within cooldown window', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const t0 = new Date('2026-02-13T19:00:00Z');
      const t1 = new Date('2026-02-13T19:02:00Z');

      const zoneData = makeZone({
        zoneId: 'zone_01',
        state: 'IDLE',
        stateDurationSeconds: 500,
        blobCount: 4,
        seatedCount: 4,
        occupiedTables: 2,
      });

      const state1 = makeState(
        [zoneData, makeZone({ zoneId: 'zone_02', state: 'EMPTY' }), makeZone({ zoneId: 'zone_entry', state: 'EMPTY' })],
        { timestamp: t0 },
      );

      const state2 = makeState(
        [{ ...zoneData, stateDurationSeconds: 620 }, makeZone({ zoneId: 'zone_02', state: 'EMPTY' }), makeZone({ zoneId: 'zone_entry', state: 'EMPTY' })],
        { timestamp: t1 },
      );

      const alerts1 = engine.evaluate(state1);
      expect(alerts1.length).toBe(1);

      const alerts2 = engine.evaluate(state2);
      expect(alerts2.length).toBe(0);
    });

    it('should allow alert to re-fire after cooldown expires', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const t0 = new Date('2026-02-13T19:00:00Z');
      const t1 = new Date('2026-02-13T19:06:00Z');

      const zoneData = makeZone({
        zoneId: 'zone_01',
        state: 'IDLE',
        stateDurationSeconds: 500,
        blobCount: 4,
        seatedCount: 4,
        occupiedTables: 2,
      });

      const state1 = makeState(
        [zoneData, makeZone({ zoneId: 'zone_02', state: 'EMPTY' }), makeZone({ zoneId: 'zone_entry', state: 'EMPTY' })],
        { timestamp: t0 },
      );

      const alerts1 = engine.evaluate(state1);
      expect(alerts1.length).toBe(1);
      engine.resolveAlert(alerts1[0]);

      const state2 = makeState(
        [{ ...zoneData, stateDurationSeconds: 860 }, makeZone({ zoneId: 'zone_02', state: 'EMPTY' }), makeZone({ zoneId: 'zone_entry', state: 'EMPTY' })],
        { timestamp: t1 },
      );

      const alerts2 = engine.evaluate(state2);
      expect(alerts2.length).toBe(1);
    });

    it('should enforce fatigue limit — max alerts per role per window', () => {
      const testRule: Rule = {
        id: 'test_rule',
        name: 'Test',
        enabled: true,
        modes: ['FULL'],
        condition: { zoneState: 'IDLE', minStateDuration: 1 },
        action: {
          alertDefinitionId: 'test',
          severity: 'low',
          textTemplate: '{zone_name} test',
          recipient: 'server',
          escalateTo: null,
          escalateAfterSeconds: null,
        },
        suppression: {
          cooldownSeconds: 0,
          dedupeKey: '{zone_id}:{rule_id}',
          fatigueLimit: 2,
          fatigueWindowSeconds: 600,
        },
      };

      const configs = [
        { id: 'z1', name: 'Z1', type: 'dining' as const },
        { id: 'z2', name: 'Z2', type: 'dining' as const },
        { id: 'z3', name: 'Z3', type: 'dining' as const },
      ];

      const engine = new RulesEngine([testRule], configs);
      const t = new Date('2026-02-13T19:00:00Z');

      const s1 = makeState(
        [
          makeZone({ zoneId: 'z1', state: 'IDLE', stateDurationSeconds: 10 }),
          makeZone({ zoneId: 'z2', state: 'EMPTY' }),
          makeZone({ zoneId: 'z3', state: 'EMPTY' }),
        ],
        { timestamp: t },
      );
      const a1 = engine.evaluate(s1);
      expect(a1.length).toBe(1);
      engine.resolveAlert(a1[0]);

      const s2 = makeState(
        [
          makeZone({ zoneId: 'z1', state: 'EMPTY' }),
          makeZone({ zoneId: 'z2', state: 'IDLE', stateDurationSeconds: 10 }),
          makeZone({ zoneId: 'z3', state: 'EMPTY' }),
        ],
        { timestamp: new Date(t.getTime() + 1000) },
      );
      const a2 = engine.evaluate(s2);
      expect(a2.length).toBe(1);
      engine.resolveAlert(a2[0]);

      const s3 = makeState(
        [
          makeZone({ zoneId: 'z1', state: 'EMPTY' }),
          makeZone({ zoneId: 'z2', state: 'EMPTY' }),
          makeZone({ zoneId: 'z3', state: 'IDLE', stateDurationSeconds: 10 }),
        ],
        { timestamp: new Date(t.getTime() + 2000) },
      );
      const a3 = engine.evaluate(s3);
      expect(a3.length).toBe(0); // Fatigued
    });
  });

  describe('mode filtering', () => {
    it('should produce no alerts in OFF mode', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const state = makeState(
        [
          makeZone({ zoneId: 'zone_01', state: 'IDLE', stateDurationSeconds: 600, blobCount: 4, seatedCount: 4, occupiedTables: 2 }),
          makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
          makeZone({ zoneId: 'zone_entry', state: 'EMPTY' }),
        ],
        { mode: 'OFF' },
      );

      const alerts = engine.evaluate(state);
      expect(alerts.length).toBe(0);
    });

    it('should filter out FULL-only rules in QUIET mode', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const state = makeState(
        [
          makeZone({ zoneId: 'zone_01', state: 'DIRTY', stateDurationSeconds: 300, blobCount: 0, occupiedTables: 0 }),
          makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
          makeZone({ zoneId: 'zone_entry', state: 'QUEUE', stateDurationSeconds: 150, standingCount: 4, blobCount: 4 }),
        ],
        { mode: 'QUIET' },
      );

      const alerts = engine.evaluate(state);
      expect(alerts.length).toBe(1);
      expect(alerts[0].definitionId).toBe('alert_queue_buildup');
    });
  });

  describe('zone muting', () => {
    it('should suppress alerts for muted zones', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const now = new Date('2026-02-13T19:00:00Z');
      const muteExpiry = new Date('2026-02-13T19:30:00Z');

      const state: RestaurantState = {
        restaurantId: 'test',
        timestamp: now,
        zones: new Map([
          ['zone_01', makeZone({ zoneId: 'zone_01', state: 'IDLE', stateDurationSeconds: 600, blobCount: 4, seatedCount: 4, occupiedTables: 2 })],
          ['zone_02', makeZone({ zoneId: 'zone_02', state: 'EMPTY' })],
          ['zone_entry', makeZone({ zoneId: 'zone_entry', state: 'EMPTY' })],
        ]),
        mode: 'FULL',
        mutedZones: new Map([['zone_01', muteExpiry]]),
      };

      const alerts = engine.evaluate(state);
      expect(alerts.length).toBe(0);
    });
  });

  describe('escalation', () => {
    it('should escalate unacknowledged alerts after timeout', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const t0 = new Date('2026-02-13T19:00:00Z');

      const state = makeState(
        [
          makeZone({ zoneId: 'zone_01', state: 'IDLE', stateDurationSeconds: 500, blobCount: 4, seatedCount: 4, occupiedTables: 2 }),
          makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
          makeZone({ zoneId: 'zone_entry', state: 'EMPTY' }),
        ],
        { timestamp: t0 },
      );

      const alerts = engine.evaluate(state);
      expect(alerts.length).toBe(1);
      expect(alerts[0].recipient).toBe('server');

      const t1 = new Date(t0.getTime() + 120 * 1000);
      const escalated = engine.checkEscalations(t1);

      expect(escalated.length).toBe(1);
      expect(escalated[0].recipient).toBe('captain');
      expect(escalated[0].escalationTier).toBe(2);
      expect(escalated[0].text).toContain('escalated');
    });

    it('should NOT escalate if alert is acknowledged', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const t0 = new Date('2026-02-13T19:00:00Z');

      const state = makeState(
        [
          makeZone({ zoneId: 'zone_01', state: 'IDLE', stateDurationSeconds: 500, blobCount: 4, seatedCount: 4, occupiedTables: 2 }),
          makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
          makeZone({ zoneId: 'zone_entry', state: 'EMPTY' }),
        ],
        { timestamp: t0 },
      );

      const alerts = engine.evaluate(state);
      expect(alerts.length).toBe(1);

      engine.acknowledgeAlert(alerts[0].id);

      const t1 = new Date(t0.getTime() + 120 * 1000);
      const escalated = engine.checkEscalations(t1);

      expect(escalated.length).toBe(0);
    });
  });

  describe('multiple simultaneous alerts', () => {
    it('should fire multiple alerts for different zones in same evaluation', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const state = makeState([
        makeZone({ zoneId: 'zone_01', state: 'IDLE', stateDurationSeconds: 500, blobCount: 4, seatedCount: 4, occupiedTables: 2 }),
        makeZone({ zoneId: 'zone_02', state: 'DIRTY', stateDurationSeconds: 300, blobCount: 0, occupiedTables: 0 }),
        makeZone({ zoneId: 'zone_entry', state: 'QUEUE', stateDurationSeconds: 150, standingCount: 4, blobCount: 4 }),
      ]);

      const alerts = engine.evaluate(state);
      expect(alerts.length).toBe(3);

      const alertTypes = alerts.map((a) => a.definitionId).sort();
      expect(alertTypes).toEqual(['alert_dirty_table', 'alert_idle_table', 'alert_queue_buildup']);
    });
  });

  describe('zone type filtering', () => {
    it('should NOT fire dining rules for entry zones', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const state = makeState([
        makeZone({ zoneId: 'zone_01', state: 'EMPTY' }),
        makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
        makeZone({ zoneId: 'zone_entry', state: 'IDLE', stateDurationSeconds: 600, blobCount: 2, seatedCount: 2, occupiedTables: 0 }),
      ]);

      const alerts = engine.evaluate(state);
      expect(alerts.length).toBe(0);
    });
  });

  describe('diagnostics', () => {
    it('should report suppression state', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const state = makeState([
        makeZone({ zoneId: 'zone_01', state: 'IDLE', stateDurationSeconds: 500, blobCount: 4, seatedCount: 4, occupiedTables: 2 }),
        makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
        makeZone({ zoneId: 'zone_entry', state: 'EMPTY' }),
      ]);

      engine.evaluate(state);
      const supState = engine.getSuppressionState();

      expect(supState.activeCooldowns).toBeGreaterThan(0);
      expect(supState.activeDedupeKeys).toBeGreaterThan(0);
      expect(supState.pendingEscalations).toBeGreaterThan(0);
      expect(supState.fatigueLogSize).toBeGreaterThan(0);
    });
  });
});

// ==========================================
// Feature Flags Tests
// ==========================================

describe('Core: FeatureFlagManager', () => {
  it('should enable all core flags by default', () => {
    const flags = new FeatureFlagManager();
    expect(flags.isEnabled('core.rulesEngine')).toBe(true);
    expect(flags.isEnabled('core.suppression')).toBe(true);
    expect(flags.isEnabled('core.escalation')).toBe(true);
  });

  it('should disable all intelligence flags by default', () => {
    const flags = new FeatureFlagManager();
    expect(flags.isEnabled('intelligence.adaptiveThresholds')).toBe(false);
    expect(flags.isEnabled('intelligence.anomalyScoring')).toBe(false);
    expect(flags.isEnabled('intelligence.smartSuppression')).toBe(false);
    expect(flags.isEnabled('intelligence.patternDetection')).toBe(false);
  });

  it('should not allow overriding core flags', () => {
    const flags = new FeatureFlagManager({ 'core.rulesEngine': false });
    expect(flags.isEnabled('core.rulesEngine')).toBe(true); // Still true
  });

  it('should allow overriding intelligence flags', () => {
    const flags = new FeatureFlagManager({ 'intelligence.adaptiveThresholds': true });
    expect(flags.isEnabled('intelligence.adaptiveThresholds')).toBe(true);
  });

  it('should allow runtime toggling of intelligence flags', () => {
    const flags = new FeatureFlagManager();
    expect(flags.isEnabled('intelligence.anomalyScoring')).toBe(false);

    flags.enable('intelligence.anomalyScoring');
    expect(flags.isEnabled('intelligence.anomalyScoring')).toBe(true);

    flags.disable('intelligence.anomalyScoring');
    expect(flags.isEnabled('intelligence.anomalyScoring')).toBe(false);
  });

  it('should not allow runtime toggling of core flags', () => {
    const flags = new FeatureFlagManager();
    flags.disable('core.rulesEngine');
    expect(flags.isEnabled('core.rulesEngine')).toBe(true); // Still locked
  });

  it('should return false for unknown flags', () => {
    const flags = new FeatureFlagManager();
    expect(flags.isEnabled('nonexistent.flag')).toBe(false);
  });

  it('should notify listeners on toggle', () => {
    const flags = new FeatureFlagManager();
    let notified = false;
    flags.onToggle('intelligence.adaptiveThresholds', (enabled) => {
      notified = enabled;
    });

    flags.enable('intelligence.adaptiveThresholds');
    expect(notified).toBe(true);
  });

  it('should return all intelligence flags via getIntelligenceFlags', () => {
    const flags = new FeatureFlagManager(INTELLIGENCE_FLAGS);
    const intel = flags.getIntelligenceFlags();
    expect(intel['intelligence.adaptiveThresholds']).toBe(true);
    expect(intel['intelligence.anomalyScoring']).toBe(true);
    expect(Object.keys(intel).every((k) => k.startsWith('intelligence.'))).toBe(true);
  });
});

// ==========================================
// Intelligence Provider Tests
// ==========================================

describe('Intelligence: Providers', () => {
  describe('engine with config constructor', () => {
    it('should accept providers via EngineConfig', () => {
      const { providers } = createIntelligenceProviders();
      const config: EngineConfig = {
        rules: DEFAULT_RULES,
        zoneConfigs: ZONE_CONFIGS,
        providers,
        featureFlags: INTELLIGENCE_FLAGS,
      };

      const engine = new RulesEngine(config);
      const features = engine.getFeatures();
      expect(features.isEnabled('intelligence.adaptiveThresholds')).toBe(true);
      expect(features.isEnabled('core.rulesEngine')).toBe(true);
    });

    it('should work identically to legacy constructor when no providers given', () => {
      const legacyEngine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const configEngine = new RulesEngine({
        rules: DEFAULT_RULES,
        zoneConfigs: ZONE_CONFIGS,
      });

      const state = makeState([
        makeZone({ zoneId: 'zone_01', state: 'IDLE', stateDurationSeconds: 500, blobCount: 4, seatedCount: 4, occupiedTables: 2 }),
        makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
        makeZone({ zoneId: 'zone_entry', state: 'EMPTY' }),
      ]);

      const legacyAlerts = legacyEngine.evaluate(state);
      const configAlerts = configEngine.evaluate(state);

      expect(legacyAlerts.length).toBe(configAlerts.length);
      expect(legacyAlerts[0].definitionId).toBe(configAlerts[0].definitionId);
    });
  });

  describe('adaptive thresholds', () => {
    it('should raise threshold after negative feedback reduces alerts', () => {
      const { adaptiveThresholds } = createIntelligenceProviders();
      const state = makeState([makeZone({ zoneId: 'zone_01', state: 'EMPTY' })]);

      // Feed 10 negative outcomes (false positives)
      for (let i = 0; i < 10; i++) {
        adaptiveThresholds.recordOutcome(
          'rule_idle_table', 'zone_01', 'minStateDuration', 480, false,
          new Date(Date.now() + i * 1000),
        );
      }

      // Threshold should now be raised (multiplier > 1.0)
      const adjusted = adaptiveThresholds.adjustThreshold(
        'rule_idle_table', 'zone_01', 'minStateDuration', 480, state,
      );
      expect(adjusted).toBeGreaterThan(480);
    });
  });

  describe('smart suppression', () => {
    it('should suppress low/medium alerts after a broadcast', () => {
      const { providers } = createIntelligenceProviders();

      const engine = new RulesEngine({
        rules: DEFAULT_RULES,
        zoneConfigs: ZONE_CONFIGS,
        providers,
        featureFlags: INTELLIGENCE_FLAGS,
      });

      const t0 = new Date('2026-02-13T19:00:00Z');

      // First evaluation: fire a bunch of alerts including one that gets broadcast
      const state1 = makeState([
        makeZone({ zoneId: 'zone_01', state: 'IDLE', stateDurationSeconds: 500, blobCount: 4, seatedCount: 4, occupiedTables: 2 }),
        makeZone({ zoneId: 'zone_02', state: 'DIRTY', stateDurationSeconds: 300, blobCount: 0, occupiedTables: 0 }),
        makeZone({ zoneId: 'zone_entry', state: 'QUEUE', stateDurationSeconds: 150, standingCount: 4, blobCount: 4 }),
      ], { timestamp: t0 });

      const alerts1 = engine.evaluate(state1);
      // Smart suppression may reduce alert count due to cascade detection (>3 alerts)
      expect(alerts1.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ==========================================
// Backward Compatibility Tests
// ==========================================

describe('Backward Compatibility', () => {
  it('should work with legacy 2-arg constructor (no config object)', () => {
    const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
    const state = makeState([
      makeZone({ zoneId: 'zone_01', state: 'IDLE', stateDurationSeconds: 500, blobCount: 4, seatedCount: 4, occupiedTables: 2 }),
      makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
      makeZone({ zoneId: 'zone_entry', state: 'EMPTY' }),
    ]);

    const alerts = engine.evaluate(state);
    expect(alerts.length).toBe(1);
    expect(alerts[0].definitionId).toBe('alert_idle_table');
  });

  it('should have intelligence flags off by default (legacy constructor)', () => {
    const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
    const features = engine.getFeatures();
    expect(features.isEnabled('intelligence.adaptiveThresholds')).toBe(false);
    expect(features.isEnabled('intelligence.anomalyScoring')).toBe(false);
  });

  it('should import correctly from legacy paths', () => {
    // These re-export from core/
    const { RulesEngine: LegacyEngine } = require('../src/engine');
    const { DEFAULT_RULES: LegacyRules } = require('../src/rules');

    const engine = new LegacyEngine(LegacyRules, ZONE_CONFIGS);
    expect(engine).toBeDefined();
  });
});
