# Sangati AI — Rules Engine Prototype

Deterministic rules engine for restaurant operational alerts. Evaluates declarative rules against a restaurant state snapshot, generates alerts with suppression (cooldown, dedup, fatigue limits), and manages escalation timers.

## Quick Start

```bash
npm install
npm test        # Run unit tests
npm run demo    # Simulate 10 minutes of dinner rush
```

## Architecture

```
RestaurantState ──► RulesEngine.evaluate() ──► Alert[]
                         │
                         ├── Condition matching (zone state, duration, blob count, etc.)
                         ├── Suppression filtering (cooldown, dedup, fatigue)
                         └── Escalation setup (timer-based tier progression)
```

## Key Files

| File | Purpose |
|---|---|
| `src/taxonomy.ts` | Type definitions: zones, states, alerts, severities |
| `src/rules.ts` | Rule format + default rule set (6 rules) |
| `src/engine.ts` | Core engine: evaluate, suppress, escalate |
| `src/index.ts` | Public API exports |
| `src/demo.ts` | 10-minute rush simulation with printed alerts |
| `test/engine.test.ts` | Unit tests covering rules, suppression, escalation, modes |

## Default Rules

| Rule | Trigger | Severity | Recipient |
|---|---|---|---|
| Idle table | IDLE >8 min | Medium | Server |
| Dirty table | DIRTY >4 min | High | Server |
| Queue buildup | QUEUE >2 min, ≥3 standing | High | Captain |
| No service | OCCUPIED, no staff >6 min | Medium | Server |
| Zone overload | ≥80% occupied + queue | High | Manager |
| Excessive wait | QUEUE >10 min | Critical | Manager |

## Suppression

- **Cooldown:** Same rule+zone won't re-fire within N seconds
- **Dedup:** Active alert with same dedup key blocks duplicates
- **Fatigue:** Max alerts per recipient role per time window

## Escalation

Unacknowledged alerts auto-escalate: Server → Captain → Manager → Broadcast.
Call `engine.acknowledgeAlert(id)` to stop escalation.
Call `engine.resolveAlert(alert)` to fully close an alert.
