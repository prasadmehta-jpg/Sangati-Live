# Sangati AI — Product Vision

> **Version:** Discovery v0.1 | **Date:** 2026-02-13 | **Status:** Draft
> **Local RAG sources:** None found. All specifics marked as ASSUMPTION where not self-evident from product context.

---

## 1. One-Line Vision

Sangati turns existing CCTV into a real-time operational nervous system for restaurants — detecting service pressure, not people.

---

## 2. Pilot Wedge — The ONE Must-Win Use Case

**"Rush-Hour Table-Turn Awareness"**

During peak service (lunch 12:00–14:00, dinner 19:00–22:00), the floor manager cannot physically see every zone. Sangati watches all zones via existing CCTV and answers one question in real time:

> *"Which tables/zones need attention RIGHT NOW, and who should act?"*

**Specifically:**
- Detect occupied-but-idle tables (food finished, no bill requested, >8 min since last plate cleared)
- Detect queue/wait-area buildup (>3 blobs standing in entry zone for >2 min)
- Detect empty-dirty tables (zone transitioned from occupied→empty, no staff blob entered zone within 4 min)
- Route a prioritized, single-sentence alert to the correct role (floor server → captain → manager escalation)

**Why this wins:**
- Directly measurable: table-turn time, wait-to-seat time
- Does NOT require POS integration (vision-only)
- Does NOT require staff to change workflows — they just get a nudge
- Low-risk privacy: blob detection, no faces, no identity

---

## 3. Explicit "Not Doing" List (MVP Exclusions)

| Excluded | Reason |
|---|---|
| Biometric identification / staff ID | Privacy-first, patent-safe, not needed for pressure detection |
| Automated ordering / POS write-back | Requires deep integration; MVP is read-only |
| Kitchen cook-time prediction | Requires per-dish CV training; out of scope for pilot |
| Customer sentiment / emotion detection | Biometric, unreliable, privacy risk |
| Multi-restaurant dashboard (cloud) | Pilot is single-site; cloud aggregation is Phase 2 |
| Mobile app for customers | B2B tool, not B2C |
| Inventory / waste tracking | Different sensor modality; not CCTV-derivable |
| Revenue attribution / financial analytics | Requires POS; pilot is ops-only |
| GenAI free-text recommendations | Phase 2; MVP is deterministic rules only |
| Staff scheduling / shift optimization | Requires HR system integration |

---

## 4. Success Metrics

All metrics measured at pilot restaurant over 4-week evaluation window.

| Metric | Baseline (ASSUMPTION) | Target | Measurement Method |
|---|---|---|---|
| Avg table-turn time (peak hours) | 48 min | ≤ 40 min (–17%) | Vision: occupied→cleared→reseated timestamp |
| Avg wait-to-seat time (peak) | 12 min | ≤ 8 min (–33%) | Vision: entry-zone blob duration |
| Dirty-table dwell time | 6 min | ≤ 3 min | Vision: empty→staff-arrives timestamp |
| Alert acknowledgement rate | N/A (no system) | ≥ 70% within 60s | App: ack/snooze/dismiss log |
| False-positive alert rate | N/A | ≤ 20% of total alerts | Manual audit: 1 hr sample/day for 1 week |
| System uptime (edge device) | N/A | ≥ 99% during service hours | Heartbeat log |
| Staff adoption (daily active users) | 0 | ≥ 80% of floor staff | App: unique logins per shift |
| Manager override frequency | N/A | < 10% of alerts | App: override action log |

**Baseline methodology:** Record 1 week of operations before Sangati activation using manual stopwatch sampling (5 tables/hour) + CCTV playback audit.

---

## 5. Constraints

### 5.1 CCTV Infrastructure (ASSUMPTION)
- Pilot restaurant has 4–8 existing CCTV cameras
- At least 2 cover the dining floor with overlapping zones
- Resolution: minimum 720p, typically 1080p
- Access via RTSP stream from NVR/DVR (most common in India: Hikvision, CP Plus, Dahua)
- Frame rate: 10–15 fps sufficient for blob detection
- **Risk:** Some restaurants use analog cameras with no network output → requires HDMI capture card fallback

### 5.2 Staff Behavior
- Staff carry personal smartphones (Android dominant in India — ASSUMPTION: 90%+ Android)
- Staff may not check phones during rush — alerts must be < 5 words + audible/haptic
- High turnover: onboarding must take < 10 min per person
- Language: alerts in English + Hindi; later Marathi, Tamil, Telugu

### 5.3 Connectivity
- Restaurant WiFi exists but unreliable during peak hours (ASSUMPTION)
- Edge device MUST operate fully offline for core detection + alerting
- Local network (LAN) between edge device and staff phones via restaurant WiFi
- Cloud sync: batch upload during off-peak (02:00–06:00) for analytics dashboard
- **Degradation mode:** If WiFi drops, alerts fall back to a wired display/TV in manager station

### 5.4 Privacy
- No biometric data captured, processed, or stored — ever
- Raw video frames processed in-memory, never written to disk
- Only event logs stored: `{timestamp, zone_id, state_transition, alert_id}`
- Edge device physically located inside restaurant premises (data sovereignty)
- Staff informed and consented (signage + onboarding)
- Compliant with India DPDP Act 2023 by design (no personal data collected)

### 5.5 Offline-First
- SQLite on edge device for all state and event logs
- Alert routing works entirely on LAN (no internet required)
- Cloud is optional and delayed — never in the critical path
- Firmware/rule updates: USB sideload or LAN push from field-ops laptop

---

## 6. Differentiation vs. Dashboards

| Traditional Dashboard | Sangati |
|---|---|
| Pull-based: manager must look | Push-based: right alert to right person |
| Shows data; requires interpretation | Shows action: "Table 7 needs clearing NOW" |
| Requires POS / manual input | Vision-only, zero manual input |
| Cloud-dependent | Offline-first, edge-processed |
| Retrospective (end-of-day reports) | Real-time (< 30s detection-to-alert) |
| Generic (same view for all roles) | Role-aware (server sees their zone; manager sees all) |
| Requires behavior change (check dashboard) | Fits existing workflow (push notification) |

**Core insight:** Restaurants don't need more data. They need fewer, better-timed nudges to the right person.

---

## DECISIONS NEEDED

1. **Pilot restaurant selection:** Which specific restaurant in which city? (Impacts CCTV vendor, layout, cuisine type, staff language)
2. **Edge hardware:** Jetson Orin Nano (~$250) vs. Intel NUC with OpenVINO (~$400) vs. Raspberry Pi 5 + Coral TPU (~$150 but limited). Decision affects power, heat, reliability.
3. **Alert delivery mechanism for MVP:** Native Android app (richer but install friction) vs. PWA (lower friction but no background push without play services) vs. WhatsApp Business API (zero install but limited UX and per-message cost)?
4. **Baseline measurement:** Can we get 1 week of pre-Sangati manual measurements, or do we estimate baselines from CCTV playback?
5. **Multi-language MVP:** Start English-only and add Hindi in Week 8, or ship bilingual from Day 1?
6. **Camera access:** Has the pilot restaurant's CCTV vendor been contacted? Do we have RTSP credentials?
