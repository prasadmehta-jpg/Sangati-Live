# Pilot Workflows — Sangati AI

> **Version:** Discovery v0.1 | **Date:** 2026-02-13 | **Status:** Draft
> **Local RAG sources:** None. All workflows based on standard Indian restaurant operations (ASSUMPTION).

---

## 1. Rush-Hour Coordination Flow

### Context
Peak service: 12:00–14:00 (lunch), 19:00–22:00 (dinner). 60–80% table occupancy. 3–5 floor staff. 1 captain. 1 manager on duty.

### Flow

```
CCTV Feed (continuous)
  │
  ▼
Edge Vision Pipeline (every 2s)
  ├── Detect blob positions per zone
  ├── Classify zone states: EMPTY | OCCUPIED | IDLE | DIRTY | QUEUE
  └── Emit state-transition events
          │
          ▼
    Rules Engine (on state change)
      ├── Match active rules against current restaurant state
      ├── Check suppression: cooldown, dedupe, fatigue limit
      └── Generate alert (if rule fires and not suppressed)
              │
              ▼
        Alert Router
          ├── Determine recipient by zone→server assignment
          ├── If server not ack within 90s → escalate to captain
          ├── If captain not ack within 120s → escalate to manager
          └── Push to recipient device
                  │
                  ▼
            Staff Device
              ├── Vibrate + tone + 1-line alert text
              ├── Actions: [ACK] [SNOOZE 5m] [DONE] [OVERRIDE: NOT VALID]
              └── Response logged → state updated
```

### Zone State Definitions

| State | Vision Signal | Duration Threshold |
|---|---|---|
| EMPTY | No blobs in zone | Immediate on transition |
| OCCUPIED | ≥1 seated blob | Immediate on transition |
| IDLE | Occupied but no movement/staff interaction | >8 min since last staff blob in zone |
| DIRTY | Transitioned from OCCUPIED→EMPTY, no staff entry | >4 min after guests leave |
| QUEUE | ≥3 standing blobs in entry zone | >2 min continuous |

---

## 2. Acknowledge / Snooze / Escalate

### Alert Lifecycle

```
ALERT CREATED
  │
  ├─── Recipient receives push ──► [ACK] ──► Alert state: ACKNOWLEDGED
  │                                              │
  │                                              ├── Staff handles task
  │                                              └── [DONE] ──► Alert state: RESOLVED
  │
  ├─── No response within 90s ──► ESCALATE to next tier
  │         │
  │         └── New recipient receives push (same alert, escalated badge)
  │
  ├─── [SNOOZE 5m] ──► Alert state: SNOOZED
  │         │
  │         └── Re-fires after 5 min if zone state unchanged
  │
  └─── [OVERRIDE: NOT VALID] ──► Alert state: OVERRIDDEN
            │
            ├── Logged for false-positive analysis
            └── Suppressed for this zone for 10 min (ASSUMPTION: configurable)
```

### Response Actions

| Action | Effect | Logged As |
|---|---|---|
| **ACK** | Marks alert as in-progress; stops escalation timer | `ack` |
| **DONE** | Resolves alert; clears from dashboard | `resolved` |
| **SNOOZE 5m** | Defers alert; re-fires if condition persists | `snoozed` |
| **OVERRIDE: NOT VALID** | Marks as false positive; suppresses zone temporarily | `overridden` |
| *(no response)* | Auto-escalates after timeout | `escalated` |

### Snooze Rules
- Maximum 2 consecutive snoozes per alert instance
- After 2nd snooze, alert auto-escalates regardless
- Snooze duration: fixed 5 min (ASSUMPTION — may need 3/5/10 options)

---

## 3. Manager Override Logic

### When Manager Overrides Apply

The floor manager can override the system in three ways:

#### 3a. Per-Alert Override
- Manager taps "OVERRIDE: NOT VALID" on any alert
- Alert is suppressed for that zone for 10 min
- Logged as `override_single`

#### 3b. Zone Suppression
- Manager taps zone on dashboard → "Mute zone for [15m / 30m / rest of shift]"
- All alerts for that zone suppressed for duration
- Visual indicator on dashboard: zone shown as "muted" with countdown
- Use case: private event, reserved section, maintenance
- Logged as `override_zone`

#### 3c. System Mode Change
- Manager can switch system mode:
  - **FULL** — all alerts active (default)
  - **QUIET** — only critical alerts (queue buildup, table wait >15 min)
  - **OFF** — no alerts (system still records state for analytics)
- Mode change requires PIN (ASSUMPTION: 4-digit, shared per role level)
- Mode auto-reverts to FULL at next shift boundary
- Logged as `override_mode`

### Override Audit Trail
All overrides logged with: `{timestamp, manager_id (role-based, not biometric), override_type, zone, duration, reason_code}`

Reason codes (ASSUMPTION):
- `private_event`
- `maintenance`
- `false_alarm`
- `staff_handling`
- `other`

---

## 4. Escalation Ladder

### Tier Structure

```
Tier 1: Floor Server (zone-assigned)
   │
   │ No ACK within 90 seconds
   ▼
Tier 2: Captain (section-assigned, covers 2–3 zones)
   │
   │ No ACK within 120 seconds
   ▼
Tier 3: Floor Manager (covers all zones)
   │
   │ No ACK within 180 seconds
   ▼
Tier 4: Broadcast (all staff devices + kitchen display + manager station TV)
```

### Escalation Rules

| Parameter | Value | Configurable? |
|---|---|---|
| Tier 1 → Tier 2 timeout | 90s | Yes (60–180s range) |
| Tier 2 → Tier 3 timeout | 120s | Yes (60–300s range) |
| Tier 3 → Tier 4 timeout | 180s | Yes (120–600s range) |
| Max escalation depth | Tier 4 (broadcast) | No |
| Escalation reset | On any ACK at any tier | No |
| Alert badge shows | "Escalated from [role]" | No |

### Escalation Context Enrichment
At each escalation tier, the alert gains context:
- **Tier 1 (original):** "Table 7: idle 10 min, needs check"
- **Tier 2 (escalated):** "⬆ Table 7: idle 10 min — server did not respond (90s)"
- **Tier 3 (escalated):** "⬆⬆ Table 7: idle 12 min — server + captain did not respond"
- **Tier 4 (broadcast):** "🔴 UNATTENDED: Table 7 idle 14 min — no response from any staff"

### De-escalation
- If zone state changes (e.g., staff blob enters zone), alert is auto-resolved
- Vision confirmation: if a staff blob is detected in the zone within 30s of alert, mark as `auto_resolved_vision`
- This prevents redundant alerts when staff are already en route

---

## 5. Shift Handover Protocol (ASSUMPTION)

At shift change:
1. All SNOOZED alerts re-fire immediately for incoming staff
2. Zone assignments update per incoming shift roster (manual config by captain)
3. System mode resets to FULL
4. All override/mute timers cancelled
5. Brief summary pushed to incoming manager: "3 tables currently occupied, 1 alert pending, 0 zones muted"

---

## DECISIONS NEEDED

1. **Escalation timeouts:** Are 90s/120s/180s reasonable? Need input from actual restaurant managers.
2. **Snooze options:** Fixed 5 min or offer 3/5/10 min choices?
3. **Override PIN:** Per-person or per-role? (Per-person requires identity management; per-role is simpler.)
4. **Tier 4 broadcast:** What physical display? TV screen in kitchen pass? Wall-mounted tablet? Existing KDS?
5. **Zone assignments:** How are servers assigned to zones? Manual roster each shift, or auto-detected?
6. **Night/low-traffic mode:** Should the system auto-detect low occupancy and reduce alert sensitivity, or rely on manual mode switching?
