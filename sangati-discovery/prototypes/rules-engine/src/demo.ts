/**
 * Sangati AI — Rules Engine Demo
 *
 * Simulates 10 minutes of restaurant service during a rush hour.
 * Prints alerts as they would fire in production.
 */

import { RulesEngine } from './engine';
import { DEFAULT_RULES } from './rules';
import type { RestaurantState, ZoneSnapshot, ZoneState } from './taxonomy';

// --- Zone Configuration ---

const ZONE_CONFIGS = [
  { id: 'zone_01', name: 'Zone A (Window)', type: 'dining' as const },
  { id: 'zone_02', name: 'Zone B (Center)', type: 'dining' as const },
  { id: 'zone_03', name: 'Zone C (Back)', type: 'dining' as const },
  { id: 'zone_entry', name: 'Entry/Lobby', type: 'entry' as const },
];

// --- Simulation Helpers ---

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
  timestamp: Date,
  zones: ZoneSnapshot[],
  mode: 'FULL' | 'QUIET' | 'OFF' = 'FULL'
): RestaurantState {
  const zoneMap = new Map<string, ZoneSnapshot>();
  for (const z of zones) {
    zoneMap.set(z.zoneId, z);
  }
  return {
    restaurantId: 'demo_restaurant',
    timestamp,
    zones: zoneMap,
    mode,
    mutedZones: new Map(),
  };
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 8);
}

function printAlert(alert: { text: string; severity: string; recipient: string; escalationTier: number; createdAt: Date }) {
  const tierLabel = alert.escalationTier > 1 ? ` [TIER ${alert.escalationTier}]` : '';
  const severityColors: Record<string, string> = {
    low: '\x1b[36m',      // cyan
    medium: '\x1b[33m',   // yellow
    high: '\x1b[31m',     // red
    critical: '\x1b[35m', // magenta
  };
  const color = severityColors[alert.severity] ?? '\x1b[0m';
  const reset = '\x1b[0m';

  console.log(
    `  ${color}[${alert.severity.toUpperCase()}]${reset} ${formatTime(alert.createdAt)} → ${alert.recipient}${tierLabel}: ${alert.text}`
  );
}

// --- Simulation Timeline ---

interface TimelineEvent {
  minuteOffset: number;
  description: string;
  zones: Partial<ZoneSnapshot & { zoneId: string }>[];
}

const TIMELINE: TimelineEvent[] = [
  {
    minuteOffset: 0,
    description: '19:00 — Dinner service starts. Zones A and B filling up.',
    zones: [
      { zoneId: 'zone_01', state: 'OCCUPIED', blobCount: 8, seatedCount: 8, occupiedTables: 3, totalTables: 5, stateDurationSeconds: 60, secondsSinceStaffVisit: 30, staffPresent: false },
      { zoneId: 'zone_02', state: 'OCCUPIED', blobCount: 6, seatedCount: 6, occupiedTables: 2, totalTables: 5, stateDurationSeconds: 120, secondsSinceStaffVisit: 60, staffPresent: true },
      { zoneId: 'zone_03', state: 'EMPTY', blobCount: 0, seatedCount: 0, occupiedTables: 0, totalTables: 5, stateDurationSeconds: 600, secondsSinceStaffVisit: 600 },
      { zoneId: 'zone_entry', state: 'EMPTY', blobCount: 0, standingCount: 0, occupiedTables: 0, totalTables: 0, stateDurationSeconds: 600, secondsSinceStaffVisit: 600 },
    ],
  },
  {
    minuteOffset: 2,
    description: '19:02 — Zone A table finishes but server is busy. Guests idle.',
    zones: [
      { zoneId: 'zone_01', state: 'OCCUPIED', blobCount: 8, seatedCount: 8, occupiedTables: 3, totalTables: 5, stateDurationSeconds: 180, secondsSinceStaffVisit: 180, staffPresent: false },
      { zoneId: 'zone_02', state: 'OCCUPIED', blobCount: 10, seatedCount: 10, occupiedTables: 4, totalTables: 5, stateDurationSeconds: 240, secondsSinceStaffVisit: 120, staffPresent: false },
      { zoneId: 'zone_03', state: 'OCCUPIED', blobCount: 4, seatedCount: 4, occupiedTables: 1, totalTables: 5, stateDurationSeconds: 60, secondsSinceStaffVisit: 30 },
      { zoneId: 'zone_entry', state: 'EMPTY', blobCount: 1, standingCount: 1, occupiedTables: 0, totalTables: 0, stateDurationSeconds: 10, secondsSinceStaffVisit: 600 },
    ],
  },
  {
    minuteOffset: 4,
    description: '19:04 — Queue starts forming at entry. Zone A still no service.',
    zones: [
      { zoneId: 'zone_01', state: 'OCCUPIED', blobCount: 8, seatedCount: 8, occupiedTables: 3, totalTables: 5, stateDurationSeconds: 300, secondsSinceStaffVisit: 300, staffPresent: false },
      { zoneId: 'zone_02', state: 'OCCUPIED', blobCount: 12, seatedCount: 12, occupiedTables: 5, totalTables: 5, stateDurationSeconds: 360, secondsSinceStaffVisit: 200, staffPresent: false },
      { zoneId: 'zone_03', state: 'OCCUPIED', blobCount: 6, seatedCount: 6, occupiedTables: 2, totalTables: 5, stateDurationSeconds: 120, secondsSinceStaffVisit: 60 },
      { zoneId: 'zone_entry', state: 'QUEUE', blobCount: 4, standingCount: 4, occupiedTables: 0, totalTables: 0, stateDurationSeconds: 90, secondsSinceStaffVisit: 600 },
    ],
  },
  {
    minuteOffset: 6,
    description: '19:06 — Entry queue >2min. Zone A no staff for 7 min. Zone B table leaves → dirty.',
    zones: [
      { zoneId: 'zone_01', state: 'OCCUPIED', blobCount: 8, seatedCount: 8, occupiedTables: 3, totalTables: 5, stateDurationSeconds: 420, secondsSinceStaffVisit: 420, staffPresent: false },
      { zoneId: 'zone_02', state: 'DIRTY', blobCount: 0, seatedCount: 0, occupiedTables: 4, totalTables: 5, stateDurationSeconds: 30, secondsSinceStaffVisit: 230, staffPresent: false },
      { zoneId: 'zone_03', state: 'OCCUPIED', blobCount: 8, seatedCount: 8, occupiedTables: 3, totalTables: 5, stateDurationSeconds: 180, secondsSinceStaffVisit: 120 },
      { zoneId: 'zone_entry', state: 'QUEUE', blobCount: 5, standingCount: 5, occupiedTables: 0, totalTables: 0, stateDurationSeconds: 150, secondsSinceStaffVisit: 600 },
    ],
  },
  {
    minuteOffset: 7,
    description: '19:07 — Queue continues. Zone A now IDLE (>8 min no staff).',
    zones: [
      { zoneId: 'zone_01', state: 'IDLE', blobCount: 6, seatedCount: 6, occupiedTables: 3, totalTables: 5, stateDurationSeconds: 480, secondsSinceStaffVisit: 480, staffPresent: false },
      { zoneId: 'zone_02', state: 'DIRTY', blobCount: 0, seatedCount: 0, occupiedTables: 4, totalTables: 5, stateDurationSeconds: 90, secondsSinceStaffVisit: 290, staffPresent: false },
      { zoneId: 'zone_03', state: 'OCCUPIED', blobCount: 10, seatedCount: 10, occupiedTables: 4, totalTables: 5, stateDurationSeconds: 240, secondsSinceStaffVisit: 180, staffPresent: false },
      { zoneId: 'zone_entry', state: 'QUEUE', blobCount: 6, standingCount: 6, occupiedTables: 0, totalTables: 0, stateDurationSeconds: 210, secondsSinceStaffVisit: 600 },
    ],
  },
  {
    minuteOffset: 8,
    description: '19:08 — Dirty table in Zone B now >4 min. Zone C losing service too.',
    zones: [
      { zoneId: 'zone_01', state: 'IDLE', blobCount: 6, seatedCount: 6, occupiedTables: 3, totalTables: 5, stateDurationSeconds: 540, secondsSinceStaffVisit: 540, staffPresent: false },
      { zoneId: 'zone_02', state: 'DIRTY', blobCount: 0, seatedCount: 0, occupiedTables: 4, totalTables: 5, stateDurationSeconds: 240, secondsSinceStaffVisit: 390, staffPresent: false },
      { zoneId: 'zone_03', state: 'OCCUPIED', blobCount: 10, seatedCount: 10, occupiedTables: 4, totalTables: 5, stateDurationSeconds: 300, secondsSinceStaffVisit: 360, staffPresent: false },
      { zoneId: 'zone_entry', state: 'QUEUE', blobCount: 7, standingCount: 7, occupiedTables: 0, totalTables: 0, stateDurationSeconds: 270, secondsSinceStaffVisit: 600 },
    ],
  },
  {
    minuteOffset: 9,
    description: '19:09 — Staff finally arrives in Zone A. Manager ACKs queue alert.',
    zones: [
      { zoneId: 'zone_01', state: 'OCCUPIED', blobCount: 7, seatedCount: 6, occupiedTables: 3, totalTables: 5, stateDurationSeconds: 10, secondsSinceStaffVisit: 10, staffPresent: true },
      { zoneId: 'zone_02', state: 'DIRTY', blobCount: 1, seatedCount: 0, occupiedTables: 4, totalTables: 5, stateDurationSeconds: 300, secondsSinceStaffVisit: 10, staffPresent: true },
      { zoneId: 'zone_03', state: 'OCCUPIED', blobCount: 10, seatedCount: 10, occupiedTables: 4, totalTables: 5, stateDurationSeconds: 360, secondsSinceStaffVisit: 420, staffPresent: false },
      { zoneId: 'zone_entry', state: 'QUEUE', blobCount: 4, standingCount: 4, occupiedTables: 0, totalTables: 0, stateDurationSeconds: 330, secondsSinceStaffVisit: 600 },
    ],
  },
  {
    minuteOffset: 10,
    description: '19:10 — Zone C still unattended. Queue persisting. Zone B being cleared.',
    zones: [
      { zoneId: 'zone_01', state: 'OCCUPIED', blobCount: 8, seatedCount: 8, occupiedTables: 4, totalTables: 5, stateDurationSeconds: 70, secondsSinceStaffVisit: 70, staffPresent: false },
      { zoneId: 'zone_02', state: 'EMPTY', blobCount: 0, seatedCount: 0, occupiedTables: 0, totalTables: 5, stateDurationSeconds: 30, secondsSinceStaffVisit: 30, staffPresent: false },
      { zoneId: 'zone_03', state: 'OCCUPIED', blobCount: 10, seatedCount: 10, occupiedTables: 4, totalTables: 5, stateDurationSeconds: 420, secondsSinceStaffVisit: 480, staffPresent: false },
      { zoneId: 'zone_entry', state: 'QUEUE', blobCount: 3, standingCount: 3, occupiedTables: 0, totalTables: 0, stateDurationSeconds: 390, secondsSinceStaffVisit: 600 },
    ],
  },
];

// --- Main ---

function main() {
  console.log('='.repeat(70));
  console.log('  SANGATI AI — Rules Engine Demo');
  console.log('  Simulating 10 minutes of dinner rush (19:00–19:10)');
  console.log('='.repeat(70));
  console.log();

  const engine = new RulesEngine(DEFAULT_RULES, ZONE_CONFIGS);
  const baseTime = new Date('2026-02-13T19:00:00+05:30');
  let totalAlerts = 0;
  let totalEscalations = 0;

  for (const event of TIMELINE) {
    const timestamp = new Date(baseTime.getTime() + event.minuteOffset * 60 * 1000);

    console.log(`\n--- ${formatTime(timestamp)} | ${event.description} ---\n`);

    // Build zone snapshots
    const zones = event.zones.map((z) => makeZone(z as Partial<ZoneSnapshot> & { zoneId: string }));
    const state = makeState(timestamp, zones);

    // Evaluate rules
    const newAlerts = engine.evaluate(state);
    for (const alert of newAlerts) {
      printAlert(alert);
      totalAlerts++;
    }

    // Check escalations
    const escalated = engine.checkEscalations(timestamp);
    for (const alert of escalated) {
      printAlert(alert);
      totalEscalations++;
    }

    if (newAlerts.length === 0 && escalated.length === 0) {
      console.log('  (no alerts)');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`  Summary: ${totalAlerts} alerts fired, ${totalEscalations} escalations`);
  const suppState = engine.getSuppressionState();
  console.log(
    `  Suppression state: ${suppState.activeCooldowns} cooldowns, ${suppState.activeDedupeKeys} dedup keys, ${suppState.pendingEscalations} pending escalations`
  );
  console.log('='.repeat(70));
}

main();
