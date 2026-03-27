# System Design — Sangati AI

> **Version:** Discovery v0.1 | **Date:** 2026-02-13 | **Status:** Draft
> **Local RAG sources:** None. Architecture based on edge-first CV system best practices.

---

## 1. Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        STAFF DEVICES                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Server   │  │ Captain  │  │ Manager  │  │ Kitchen KDS  │   │
│  │ App      │  │ App      │  │ App/Tab  │  │ (Phase 2)    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       └──────────────┴──────────────┴───────────────┘           │
│                         WebSocket (LAN)                         │
├─────────────────────────────────────────────────────────────────┤
│                        EDGE DEVICE                              │
│                                                                 │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌──────────────┐   │
│  │ INGEST  │──▶│ VISION  │──▶│  STATE  │──▶│   RULES      │   │
│  │ Layer   │   │ Layer   │   │  Layer  │   │   ENGINE     │   │
│  └─────────┘   └─────────┘   └─────────┘   └──────┬───────┘   │
│                                                     │           │
│                                              ┌──────▼───────┐   │
│                                              │   ROUTING    │   │
│                                              │   Layer      │   │
│                                              └──────┬───────┘   │
│                                                     │           │
│  ┌─────────────────────┐         ┌──────────────────▼────────┐  │
│  │   SQLite (events,   │◀────────│   ALERT DELIVERY         │  │
│  │   alerts, state)    │         │   (WebSocket server)      │  │
│  └─────────┬───────────┘         └───────────────────────────┘  │
│            │                                                    │
├────────────┼────────────────────────────────────────────────────┤
│            │           CLOUD (OPTIONAL)                         │
│  ┌─────────▼───────────┐   ┌─────────────────────────────────┐  │
│  │  Batch Sync Agent   │──▶│  Analytics API + Dashboard      │  │
│  │  (off-peak upload)  │   │  (Owner morning report)         │  │
│  └─────────────────────┘   └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer Descriptions

### 2.1 Ingest Layer
**Responsibility:** Connect to CCTV cameras, decode video streams, produce frames for vision pipeline.

| Component | Technology | Notes |
|---|---|---|
| RTSP client | FFmpeg / GStreamer | Connects to NVR/DVR, decodes H.264/H.265 |
| Frame sampler | Custom (Python) | Samples 1 frame every 2 seconds (0.5 fps to vision pipeline) |
| Health check | Heartbeat per camera | Detects camera disconnect within 10s |
| Multi-camera | 1 ingest thread per camera | 4–8 cameras × 0.5 fps = 2–4 frames/s total |

**Output:** Raw frames (JPEG/NV12) on internal message bus (MQTT topic: `camera/<cam_id>/frame`)

### 2.2 Vision Layer
**Responsibility:** Detect blobs (people), classify positions, map to zones.

| Component | Technology | Notes |
|---|---|---|
| Blob detector | YOLOv8n or MobileNet-SSD | Lightweight person detection, optimized for edge |
| Pose classifier | Rule-based (bbox aspect ratio) | Seated (wide, low) vs. standing (tall, narrow) vs. moving (position delta) |
| Zone mapper | Geometric: point-in-polygon | Detected blob center → which zone polygon |
| Background model | Running average | Detect occupancy changes, not individuals |

**Output:** Zone occupancy events on MQTT topic: `zone/<zone_id>/occupancy`

```json
{
  "zone_id": "zone_03",
  "timestamp": "2026-02-13T19:45:02Z",
  "blob_count": 4,
  "seated_count": 3,
  "standing_count": 1,
  "staff_present": false
}
```

**Privacy guarantee:** Raw frame is discarded after inference. Only the structured event is emitted.

### 2.3 State Layer
**Responsibility:** Maintain current restaurant state, detect state transitions.

| Concept | Description |
|---|---|
| Restaurant state | Aggregate of all zone states + active alerts + staff assignments |
| Zone state machine | EMPTY → OCCUPIED → IDLE → DIRTY → EMPTY (+ QUEUE for entry zone) |
| Transition rules | Time-based thresholds trigger state changes (e.g., OCCUPIED + no staff >8 min → IDLE) |
| State store | In-memory (for speed) + SQLite write-ahead (for persistence) |

**State machine per zone:**

```
                    ┌──────────────┐
            ┌──────▶│    EMPTY     │◀──────────────┐
            │       └──────┬───────┘               │
            │              │ blob detected          │ table cleared
            │              ▼                        │  + reset
            │       ┌──────────────┐               │
            │       │  OCCUPIED    │───────────────►│
            │       └──────┬───────┘  guests leave  │
            │              │                        │
            │              │ no staff               │
            │              │ interaction             │
            │              │ >8 min                  │
            │              ▼                        │
            │       ┌──────────────┐               │
            │       │    IDLE      │               │
            │       └──────┬───────┘               │
            │              │ guests leave           │
            │              ▼                        │
            │       ┌──────────────┐               │
            └───────│    DIRTY     │───────────────┘
                    │  (no staff   │  staff enters
                    │   >4 min)    │  zone
                    └──────────────┘

  Entry zone only:
            ┌──────────────┐
            │    QUEUE     │  ≥3 standing blobs >2 min
            └──────────────┘
```

**Output:** State-transition events on MQTT topic: `state/<zone_id>/transition`

### 2.4 Rules Engine
**Responsibility:** Evaluate declarative rules against restaurant state, produce alert candidates.

| Concept | Description |
|---|---|
| Rule format | JSON: condition (state predicate) + action (alert template) + suppression config |
| Evaluation trigger | On every state-transition event |
| Suppression | Cooldown (per alert type), dedup (per zone+type), fatigue (per role, max alerts/window) |
| Escalation | Timer-based: if no ACK within N seconds, re-emit with escalated tier |

See `prototypes/rules-engine/` for working implementation.

**Output:** Alert objects on MQTT topic: `alerts/new`

### 2.5 Routing Layer
**Responsibility:** Determine which device(s) receive each alert.

| Logic | Description |
|---|---|
| Zone → Server mapping | Configurable per shift. Captain enters roster. |
| Tier resolution | Alert severity + zone assignment → primary recipient |
| Escalation routing | Tier 1 (server) → Tier 2 (captain) → Tier 3 (manager) → Tier 4 (broadcast) |
| Mode filtering | If system mode = QUIET, only route CRITICAL alerts. If OFF, route nothing. |
| Mute filtering | If zone is muted, suppress all alerts for that zone. |

**Output:** Routed alerts on MQTT topic: `alerts/routed/<device_id>`

### 2.6 Alert Delivery (WebSocket Server)
**Responsibility:** Push alerts to connected staff devices in real-time.

| Component | Technology | Notes |
|---|---|---|
| WebSocket server | ws (Node.js) or websockets (Python) | Runs on edge device, LAN-only |
| Client auth | Device token (issued at onboarding) | Not biometric |
| Message format | JSON: `{alert_id, type, text, severity, zone, actions, timestamp}` |
| ACK handling | Client sends ACK/SNOOZE/DONE/OVERRIDE → updates alert state |
| Offline client | Alert queued for 5 min. If client reconnects, delivered. Otherwise, escalated. |

---

## 3. Three-Layer Intelligence

### Layer 1: Deterministic Rules (MVP — Week 1-8)
- Hand-crafted if-then rules
- Fully explainable: "This alert fired because Table 7 has been idle for 10 minutes"
- 100% predictable: same input always produces same output
- Configurable thresholds by restaurant/owner

### Layer 2: ML-Assisted (Phase 2 — Month 3-6)
- **After** sufficient data from Layer 1 operation
- Pattern detection: "Tuesdays have 20% faster turns — suggest different thresholds"
- Anomaly detection: "Unusual queue at 15:00 — not a typical rush time"
- Threshold tuning: ML suggests optimal idle/dirty/queue thresholds per restaurant
- **Guardrail:** ML suggestions require manager approval before becoming active rules

### Layer 3: GenAI Explanations (Phase 3 — Month 6+)
- Natural language summaries: "Tonight's dinner rush was 15% busier than average. Zone 2 had the longest idle times, likely because Rahul was also covering Zone 3."
- Conversational analytics: Owner asks "Why were table turns slow last Thursday?" → GenAI synthesizes from event logs
- **Guardrails:**
  - GenAI never makes operational decisions
  - GenAI never generates real-time alerts
  - GenAI only reads from aggregate/anonymized data
  - All GenAI outputs labeled as "AI-generated insight"
  - Owner can disable GenAI entirely

---

## 4. Data Model

### 4.1 Core Entities

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Restaurant  │────▶│    Zone      │────▶│    Table     │
│              │     │              │     │  (optional)  │
└──────┬───────┘     └──────┬───────┘     └──────────────┘
       │                    │
       │             ┌──────▼───────┐
       │             │  Zone State  │
       │             │  (current)   │
       │             └──────────────┘
       │
┌──────▼───────┐     ┌──────────────┐     ┌──────────────┐
│    Staff     │────▶│  Assignment  │────▶│    Shift     │
│  (role-based)│     │  (zone map)  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐
│    Rule      │────▶│    Alert     │────▶ Alert Actions
│              │     │              │     (ACK/SNOOZE/etc)
└──────────────┘     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │  Escalation  │
                     │  (tier log)  │
                     └──────────────┘
```

### 4.2 SQLite Schema (Edge)

```sql
-- Restaurant configuration
CREATE TABLE restaurant (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  config JSON -- thresholds, modes, etc.
);

-- Zones (defined during setup)
CREATE TABLE zone (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT REFERENCES restaurant(id),
  name TEXT NOT NULL,
  camera_id TEXT,
  polygon JSON, -- [[x1,y1],[x2,y2],...] normalized coordinates
  zone_type TEXT CHECK(zone_type IN ('dining','entry','pass','bar')),
  table_count INTEGER DEFAULT 0
);

-- Zone state log (append-only)
CREATE TABLE zone_state_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id TEXT REFERENCES zone(id),
  state TEXT CHECK(state IN ('EMPTY','OCCUPIED','IDLE','DIRTY','QUEUE')),
  blob_count INTEGER,
  staff_present BOOLEAN,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Staff (role-based, no biometric ID)
CREATE TABLE staff (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT REFERENCES restaurant(id),
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('server','captain','manager','kitchen','owner')),
  device_token TEXT,
  active BOOLEAN DEFAULT 1
);

-- Shift assignments
CREATE TABLE shift_assignment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id TEXT REFERENCES staff(id),
  zone_id TEXT REFERENCES zone(id),
  shift_date DATE,
  shift_type TEXT CHECK(shift_type IN ('lunch','dinner','full')),
  assigned_by TEXT REFERENCES staff(id)
);

-- Rules (configured by owner/admin)
CREATE TABLE rule (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  condition JSON,  -- state predicate
  alert_template JSON,  -- alert fields
  cooldown_seconds INTEGER DEFAULT 300,
  dedupe_key TEXT,
  escalate_after_seconds INTEGER,
  escalate_to TEXT,
  active BOOLEAN DEFAULT 1
);

-- Alerts (generated by rules engine)
CREATE TABLE alert (
  id TEXT PRIMARY KEY,
  rule_id TEXT REFERENCES rule(id),
  zone_id TEXT REFERENCES zone(id),
  severity TEXT CHECK(severity IN ('low','medium','high','critical')),
  text TEXT,
  state TEXT CHECK(state IN ('new','delivered','acknowledged','snoozed','resolved','overridden','escalated')),
  assigned_to TEXT REFERENCES staff(id),
  escalation_tier INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Alert actions (log of staff responses)
CREATE TABLE alert_action (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id TEXT REFERENCES alert(id),
  staff_id TEXT REFERENCES staff(id),
  action TEXT CHECK(action IN ('ack','snooze','done','override','escalated','auto_resolved')),
  reason_code TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for query performance
CREATE INDEX idx_zone_state_log_ts ON zone_state_log(zone_id, timestamp);
CREATE INDEX idx_alert_state ON alert(state, created_at);
CREATE INDEX idx_alert_zone ON alert(zone_id, created_at);
CREATE INDEX idx_alert_action_ts ON alert_action(alert_id, timestamp);
```

---

## 5. Offline-First Data Sync Strategy

### 5.1 Principles
1. Edge is the source of truth during service hours
2. Cloud is a mirror for analytics — never authoritative for operations
3. Sync failure = acceptable. Operations continue indefinitely without cloud.
4. Sync is append-only. No bidirectional conflict resolution needed (MVP).

### 5.2 Sync Mechanism

```
Edge SQLite ──[batch export]──▶ JSON Lines file
  │                                    │
  │  (during off-peak: 02:00-06:00)    │
  │                                    ▼
  │                            HTTPS POST to Cloud API
  │                                    │
  │                                    ▼
  │                            Cloud PostgreSQL
  │                            (analytics store)
  │
  ├── [config sync] ◀── Cloud pushes rule updates, firmware
  │                      (pulled by edge on next boot or manual trigger)
  │
  └── [no real-time cloud dependency]
```

### 5.3 Sync Payload

```json
{
  "restaurant_id": "rest_001",
  "edge_device_id": "edge_001",
  "sync_timestamp": "2026-02-14T03:00:00Z",
  "period": {
    "from": "2026-02-13T10:00:00Z",
    "to": "2026-02-14T02:00:00Z"
  },
  "zone_state_transitions": [ ... ],
  "alerts": [ ... ],
  "alert_actions": [ ... ],
  "daily_summary": {
    "total_alerts": 187,
    "ack_rate": 0.73,
    "avg_table_turn_minutes": 41,
    "avg_wait_to_seat_minutes": 7,
    "peak_occupancy_pct": 0.85
  }
}
```

### 5.4 Conflict Resolution
- No conflicts possible: edge is append-only, cloud is read-only mirror
- Config updates (rules, thresholds) flow one-way: cloud → edge
- Config applied on next boot or manual "refresh" by field ops
- Version vector: each config has a `version` field. Edge only applies if `version > current`.

### 5.5 Data Retention

| Location | Retention | Notes |
|---|---|---|
| Edge SQLite | 30 days rolling | Auto-prune via daily cron job |
| Cloud PostgreSQL | 1 year (ASSUMPTION) | Configurable per restaurant |
| Raw video | 0 seconds | Never stored |
| Alert actions | 30 days edge / 1 year cloud | Owner audit trail |

---

## 6. System Resilience

| Failure | Detection | Recovery | Impact |
|---|---|---|---|
| Camera disconnect | Heartbeat miss (10s) | Alert manager: "CAM-1 offline" | Affected zones lose detection; other zones unaffected |
| Edge device crash | systemd watchdog | Auto-restart within 60s | 60s gap in detection. State rebuilt from SQLite. |
| WiFi AP failure | Device disconnect count spike | Alert manager: "Fallback to display" | Alerts route to wired display. Phone alerts delayed. |
| Power outage | UPS provides 15 min (ASSUMPTION) | Graceful shutdown after 10 min | Full outage. Ops revert to manual. |
| Internet outage | Cloud sync fails | Retry next window. No operational impact. | Analytics delayed. Operations unaffected. |
| Staff phone dies | WebSocket disconnect | Alerts rerouted or escalated after timeout | Single person misses alerts; escalation handles it. |

---

## DECISIONS NEEDED

1. **Message bus:** MQTT (Mosquitto) vs. in-process event emitter (simpler but less observable)? MQTT is better for debugging and adding consumers.
2. **Vision model:** YOLOv8n vs. MobileNet-SSD vs. simpler background subtraction? Need to benchmark on actual restaurant footage.
3. **Staff detection:** How do we distinguish staff blobs from customer blobs? Options: staff wear a colored marker (apron/cap), zone-entry patterns, or skip staff detection in MVP and rely on "no staff interaction" = "no blob entered zone."
4. **Table-level vs. zone-level:** Does the MVP detect per-table state or per-zone? Per-table requires more precise detection. Per-zone is simpler but less specific alerts.
5. **Multi-camera fusion:** How to handle overlapping camera zones? Average detections? Use highest-confidence camera? Defer to single-camera-per-zone for MVP?
