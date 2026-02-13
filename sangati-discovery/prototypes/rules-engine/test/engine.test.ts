/**
 * Sangati AI — Rules Engine Tests
 */

import { RulesEngine } from '../src/engine';
import { DEFAULT_RULES } from '../src/rules';
import type { Rule } from '../src/rules';
import type { RestaurantState, ZoneSnapshot, Alert } from '../src/taxonomy';

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
  overrides?: Partial<Pick<RestaurantState, 'mode' | 'timestamp'>>
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

// --- Tests ---

describe('RulesEngine', () => {
  describe('basic rule evaluation', () => {
    it('should fire idle table alert when zone is IDLE for >8 minutes', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const state = makeState([
        makeZone({
          zoneId: 'zone_01',
          state: 'IDLE',
          stateDurationSeconds: 500, // >480s (8 min)
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
          stateDurationSeconds: 300, // <480s
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
          stateDurationSeconds: 260, // >240s (4 min)
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
          stateDurationSeconds: 150, // >120s
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
          secondsSinceStaffVisit: 400, // >360s (6 min)
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
      const t1 = new Date('2026-02-13T19:02:00Z'); // 2 min later, within 5 min cooldown

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
        { timestamp: t0 }
      );

      const state2 = makeState(
        [{ ...zoneData, stateDurationSeconds: 620 }, makeZone({ zoneId: 'zone_02', state: 'EMPTY' }), makeZone({ zoneId: 'zone_entry', state: 'EMPTY' })],
        { timestamp: t1 }
      );

      const alerts1 = engine.evaluate(state1);
      expect(alerts1.length).toBe(1);

      const alerts2 = engine.evaluate(state2);
      expect(alerts2.length).toBe(0); // Cooldown active
    });

    it('should allow alert to re-fire after cooldown expires', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const t0 = new Date('2026-02-13T19:00:00Z');
      const t1 = new Date('2026-02-13T19:06:00Z'); // 6 min later, after 5 min cooldown

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
        { timestamp: t0 }
      );

      // Resolve the first alert to clear dedup
      const alerts1 = engine.evaluate(state1);
      expect(alerts1.length).toBe(1);
      engine.resolveAlert(alerts1[0]);

      const state2 = makeState(
        [{ ...zoneData, stateDurationSeconds: 860 }, makeZone({ zoneId: 'zone_02', state: 'EMPTY' }), makeZone({ zoneId: 'zone_entry', state: 'EMPTY' })],
        { timestamp: t1 }
      );

      const alerts2 = engine.evaluate(state2);
      expect(alerts2.length).toBe(1); // Cooldown expired, should re-fire
    });

    it('should enforce fatigue limit — max alerts per role per window', () => {
      // Use a custom rule set with low fatigue limit for testing
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
          cooldownSeconds: 0, // No cooldown for test
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

      // Fire for zone 1
      const s1 = makeState(
        [
          makeZone({ zoneId: 'z1', state: 'IDLE', stateDurationSeconds: 10 }),
          makeZone({ zoneId: 'z2', state: 'EMPTY' }),
          makeZone({ zoneId: 'z3', state: 'EMPTY' }),
        ],
        { timestamp: t }
      );
      const a1 = engine.evaluate(s1);
      expect(a1.length).toBe(1);
      engine.resolveAlert(a1[0]); // Clear dedup for zone

      // Fire for zone 2
      const s2 = makeState(
        [
          makeZone({ zoneId: 'z1', state: 'EMPTY' }),
          makeZone({ zoneId: 'z2', state: 'IDLE', stateDurationSeconds: 10 }),
          makeZone({ zoneId: 'z3', state: 'EMPTY' }),
        ],
        { timestamp: new Date(t.getTime() + 1000) }
      );
      const a2 = engine.evaluate(s2);
      expect(a2.length).toBe(1);
      engine.resolveAlert(a2[0]);

      // Zone 3 should be fatigued (limit = 2)
      const s3 = makeState(
        [
          makeZone({ zoneId: 'z1', state: 'EMPTY' }),
          makeZone({ zoneId: 'z2', state: 'EMPTY' }),
          makeZone({ zoneId: 'z3', state: 'IDLE', stateDurationSeconds: 10 }),
        ],
        { timestamp: new Date(t.getTime() + 2000) }
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
        { mode: 'OFF' }
      );

      const alerts = engine.evaluate(state);
      expect(alerts.length).toBe(0);
    });

    it('should filter out FULL-only rules in QUIET mode', () => {
      const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
      const state = makeState(
        [
          // Dirty table (FULL only rule)
          makeZone({ zoneId: 'zone_01', state: 'DIRTY', stateDurationSeconds: 300, blobCount: 0, occupiedTables: 0 }),
          makeZone({ zoneId: 'zone_02', state: 'EMPTY' }),
          // Queue (FULL + QUIET rule)
          makeZone({ zoneId: 'zone_entry', state: 'QUEUE', stateDurationSeconds: 150, standingCount: 4, blobCount: 4 }),
        ],
        { mode: 'QUIET' }
      );

      const alerts = engine.evaluate(state);
      // Only queue alert should fire (dirty is FULL-only)
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
        { timestamp: t0 }
      );

      const alerts = engine.evaluate(state);
      expect(alerts.length).toBe(1);
      expect(alerts[0].recipient).toBe('server');

      // 2 minutes later — escalation timer (90s) should have triggered
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
        { timestamp: t0 }
      );

      const alerts = engine.evaluate(state);
      expect(alerts.length).toBe(1);

      // Acknowledge the alert
      engine.acknowledgeAlert(alerts[0].id);

      // Check escalation after timeout
      const t1 = new Date(t0.getTime() + 120 * 1000);
      const escalated = engine.checkEscalations(t1);

      expect(escalated.length).toBe(0);
    });
  });

  describe('multiple simultaneous alerts', () => {
    it('should fire multiple alerts for different zones in same evaluation', () => {
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
        makeZone({
          zoneId: 'zone_02',
          state: 'DIRTY',
          stateDurationSeconds: 300,
          blobCount: 0,
          occupiedTables: 0,
        }),
        makeZone({
          zoneId: 'zone_entry',
          state: 'QUEUE',
          stateDurationSeconds: 150,
          standingCount: 4,
          blobCount: 4,
        }),
      ]);

      const alerts = engine.evaluate(state);

      // Should get: idle table (zone_01) + dirty table (zone_02) + queue (zone_entry)
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
        // Entry zone in IDLE state — dining rules should not match
        makeZone({
          zoneId: 'zone_entry',
          state: 'IDLE',
          stateDurationSeconds: 600,
          blobCount: 2,
          seatedCount: 2,
          occupiedTables: 0,
        }),
      ]);

      const alerts = engine.evaluate(state);
      // Idle table rule requires dining zone type
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
