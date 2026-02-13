# MVP Scope — Sangati AI

> **Version:** Discovery v0.1 | **Date:** 2026-02-13 | **Status:** Draft
> **Local RAG sources:** None. Scope derived from product-vision.md and pilot-workflows.md.

---

## 1. MVP Definition

**MVP = Minimum Viable Pilot** — deployed at ONE restaurant, proving ONE use case, with ONE edge device.

**Pilot wedge:** Rush-Hour Table-Turn Awareness
**Duration:** 8 weeks (2 weeks install + 4 weeks active + 2 weeks evaluation)
**Users:** 1 manager, 1–2 captains, 4–8 floor servers

---

## 2. In-Scope Features

### 2.1 Vision Pipeline (Edge)

| Feature | Acceptance Criteria |
|---|---|
| CCTV ingestion via RTSP | Connects to ≥2 cameras, 10 fps, 720p minimum |
| Zone definition | Configurable rectangular zones overlaid on camera feed (setup tool) |
| Blob detection | Detects human-shaped blobs, classifies as seated/standing/moving |
| Zone state classification | Correctly classifies: EMPTY, OCCUPIED, IDLE, DIRTY, QUEUE (≥80% accuracy) |
| State-transition events | Emits timestamped events on every zone state change |
| Edge processing only | No frames leave the device. Processing in-memory. |

### 2.2 Rules Engine (Edge)

| Feature | Acceptance Criteria |
|---|---|
| Rule evaluation | Evaluates rules against current restaurant state on every state change |
| Alert generation | Produces alerts with: id, severity, text, recipient_role, zone |
| Cooldown suppression | Same alert not re-fired within configurable cooldown (default 5 min) |
| Deduplication | Same zone + same alert type = deduplicated while condition persists |
| Alert fatigue limit | Max 5 alerts per role per 10-min window (ASSUMPTION: configurable) |
| Escalation timer | Auto-escalates unacknowledged alerts per tier timeouts |

### 2.3 Alert Routing (Edge → LAN)

| Feature | Acceptance Criteria |
|---|---|
| Role-based routing | Alerts routed to correct role based on zone→server assignment |
| Push to device | Alert delivered to staff device within 3s of generation |
| Escalation delivery | Escalated alerts include context ("escalated from server") |
| Broadcast fallback | Tier 4 alerts visible on all devices + display screen |
| Offline operation | Full alert pipeline works on LAN only, no internet required |

### 2.4 Staff App (Android)

| Feature | Acceptance Criteria |
|---|---|
| Alert notification | Push notification with vibrate + sound. ≤8 words. |
| Alert actions | ACK / SNOOZE 5m / DONE / OVERRIDE: NOT VALID — single tap each |
| Zone view | Server sees their zone's current state (table indicators) |
| Minimal onboarding | First-time setup ≤ 5 minutes (enter name, select role, select zone) |
| Battery impact | <5% battery drain per 8-hour shift (ASSUMPTION: target) |
| Device support | Android 10+, 2GB RAM minimum |

### 2.5 Manager Dashboard (Android App or Tablet)

| Feature | Acceptance Criteria |
|---|---|
| Floor overview | All zones visible with color-coded states |
| Active alerts list | Sorted by severity, shows alert + zone + age + assigned to |
| Zone mute | Tap zone → mute for 15m / 30m / rest of shift |
| System mode | Toggle FULL / QUIET / OFF (PIN protected) |
| Override log | View today's overrides |

### 2.6 Analytics (Edge, Batch Sync to Cloud)

| Feature | Acceptance Criteria |
|---|---|
| Event logging | All state transitions and alert actions stored in SQLite |
| Daily summary | Compute: avg table-turn, avg wait-to-seat, alert stats |
| Morning report | Push daily summary to owner at 07:00 (WhatsApp or app) |
| Cloud sync | Batch upload analytics during off-peak (02:00–06:00) when internet available |

---

## 3. Out-of-Scope (MVP Exclusions)

| Feature | Rationale | Phase |
|---|---|---|
| POS integration | Not required for vision-only pilot | Phase 2 |
| Kitchen integration (pass pickup, overload) | Adds complexity; may not have pass camera | Phase 2 |
| Multi-outlet dashboard | Pilot is single-site | Phase 2 |
| GenAI explanations / recommendations | Deterministic rules sufficient for MVP | Phase 2 |
| ML-based anomaly detection | Need baseline data first; rules are more predictable | Phase 2 |
| Customer-facing features | B2B tool only | Not planned |
| Staff scheduling integration | Requires HR system | Phase 3 |
| Inventory / waste tracking | Different sensor modality | Phase 3 |
| iOS app | Indian market is Android-dominant | Phase 2 if needed |
| Multi-language (beyond English + Hindi) | Pilot market specific | Phase 2 |

---

## 4. MVP Alert Set (Minimum)

These alerts MUST work in MVP:

| # | Alert | Trigger | Severity | Recipient |
|---|---|---|---|---|
| 1 | Table idle too long | OCCUPIED → IDLE >8 min | Medium | Zone server |
| 2 | Dirty table not cleared | OCCUPIED → EMPTY → DIRTY >4 min | High | Zone server |
| 3 | Entry queue building | QUEUE state >2 min, ≥3 blobs | High | Captain |
| 4 | Table waiting for service | OCCUPIED, no staff in zone >6 min | Medium | Zone server |
| 5 | Unacknowledged escalation | Any alert escalated to Tier 3+ | Critical | Manager |
| 6 | Zone overload | ≥80% tables in zone occupied + QUEUE detected | High | Manager |

---

## 5. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Detection-to-alert latency | <30 seconds |
| Alert delivery latency (LAN) | <3 seconds |
| System uptime during service hours | ≥99% |
| False positive rate | ≤20% of total alerts |
| Edge device recovery from crash | Auto-restart within 60 seconds |
| Data storage (edge) | 30 days of event logs (~500MB — ASSUMPTION) |
| Concurrent users | 10 devices on LAN (ASSUMPTION) |

---

## 6. MVP User Stories

```
As a floor server,
  I want to receive a short alert when my zone has an idle table,
  so I can check on the guests before they get frustrated.

As a captain,
  I want to know when the entry area has a queue building,
  so I can expedite seating or manage wait expectations.

As a floor manager,
  I want to see all zones at a glance with their current state,
  so I can direct staff without walking the entire floor.

As a floor manager,
  I want to mute a zone for a private event,
  so the system doesn't generate irrelevant alerts.

As an owner,
  I want a daily summary of service performance,
  so I can track improvement week-over-week without being on-site.

As a floor server,
  I want to mark an alert as "not valid" when the system is wrong,
  so I'm not penalized for false positives and the system improves.
```

---

## 7. Acceptance Criteria for "MVP Complete"

The MVP pilot is considered successful when:

1. System runs for 4 consecutive weeks during all service hours without unplanned downtime >30 min
2. ≥80% of floor staff use the app daily (unique logins per shift)
3. Alert acknowledgement rate ≥70% within 60 seconds
4. False positive rate ≤20% (validated by 1-hour manual audit per day for 1 week)
5. Table-turn time shows measurable improvement (any positive delta vs. baseline)
6. Manager confirms: "I would continue using this" (qualitative interview)
7. No privacy incidents or staff complaints about surveillance

---

## DECISIONS NEEDED

1. **Alert delivery mechanism:** Native app vs. PWA vs. WhatsApp? Impacts development scope significantly.
2. **Setup tool for zones:** Standalone desktop app? Web UI? CLI with image overlay? Needed before pilot.
3. **Morning report delivery:** WhatsApp Business API vs. in-app notification? WhatsApp is lower friction but has per-message cost.
4. **MVP alert thresholds:** Are the default values (8 min idle, 4 min dirty, 2 min queue) reasonable? Need field validation.
5. **Staff onboarding flow:** Self-serve (app sign-up) or admin-configured (manager enters all staff)?
