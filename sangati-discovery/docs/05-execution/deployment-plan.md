# Deployment Plan — Sangati AI Pilot

> **Version:** Discovery v0.1 | **Date:** 2026-02-13 | **Status:** Draft
> **Local RAG sources:** None. Based on Indian restaurant deployment assumptions.

---

## 1. Deployment Overview

**Type:** Single-restaurant pilot deployment
**Duration:** 8 weeks total (2 weeks install/configure + 4 weeks active + 2 weeks evaluation)
**Team:** 1 field-ops engineer on-site for install week; remote support thereafter

---

## 2. Pre-Deployment Checklist (Week -2 to -1)

### 2.1 Restaurant Assessment

| # | Check | Method | Pass Criteria | Notes |
|---|---|---|---|---|
| 1 | CCTV system exists and operational | On-site visit | ≥2 cameras covering dining floor + entry | If analog-only, budget HDMI capture cards |
| 2 | CCTV brand/model identified | Visual inspection + NVR admin panel | Hikvision / CP Plus / Dahua / ONVIF-compatible | Note model numbers for RTSP URL format |
| 3 | RTSP access verified | `ffprobe rtsp://...` from laptop | Stream connects, video decoded | Test during service hours (network load) |
| 4 | WiFi AP exists | Speed test on phone | ≥10 Mbps LAN, covers dining floor | If poor, recommend dedicated AP (~$30) |
| 5 | Power outlet near NVR/server room | Visual inspection | 1 available outlet, preferably UPS-backed | If no UPS, budget one (~$50 for 600VA) |
| 6 | Internet available (for cloud sync) | Speed test | ≥5 Mbps (not required during service) | Cloud sync is optional; offline is fine |
| 7 | Restaurant layout mapped | Floor plan sketch or photo | All dining zones, entry, kitchen pass identified | Used for zone polygon configuration |
| 8 | Staff roster obtained | Manager interview | Names, roles, shift assignments | For initial zone→server mapping |
| 9 | Manager champion identified | Conversation | Manager is willing and motivated | Critical for adoption |
| 10 | Owner approval obtained | Written consent | Privacy notice signed, system explained | Required before any camera access |

### 2.2 Hardware Preparation (Off-site)

| # | Item | Spec | Status |
|---|---|---|---|
| 1 | Edge device (Jetson Orin Nano — ASSUMPTION) | Pre-loaded with Sangati OS image | Flash NVMe, test boot |
| 2 | Power supply + cable | 15V/3A USB-C or barrel | Tested |
| 3 | Ethernet cable (3m) | Cat6 | For NVR/switch connection |
| 4 | HDMI capture card (if needed) | USB 3.0, 1080p/30fps | Only for analog CCTV |
| 5 | Mounting bracket / velcro | For edge device | Attach near NVR or in server closet |
| 6 | UPS (if restaurant lacks one) | 600VA line-interactive | 15 min battery backup |
| 7 | Spare Ethernet cable | Cat6, 5m | Backup |
| 8 | USB drive | 32 GB, with recovery image | For emergency re-flash |

### 2.3 Software Preparation (Off-site)

| # | Task | Status |
|---|---|---|
| 1 | Build latest Sangati edge image | Docker images for all services |
| 2 | Pre-configure restaurant ID, timezone | `config.json` |
| 3 | Load default rule set | `rules.json` with DEFAULT_RULES |
| 4 | Load alert taxonomy | `taxonomy.json` |
| 5 | Prepare zone config tool | Web UI accessible on LAN for polygon definition |
| 6 | Build Android APK (latest) | Signed release build |
| 7 | Test APK on reference devices | Budget Android (Redmi Note series — ASSUMPTION) |

---

## 3. Installation Day (Day 1)

### Timeline

| Time | Activity | Duration |
|---|---|---|
| 10:00 | Arrive at restaurant. Meet manager. Tour floor. | 30 min |
| 10:30 | Access NVR/server room. Connect edge device. | 30 min |
| 11:00 | Verify RTSP streams from all cameras. | 30 min |
| 11:30 | Configure zones using zone-config tool (camera snapshots + polygon overlay). | 60 min |
| 12:30 | Lunch break (observe service — note staff behavior, pain points). | 60 min |
| 13:30 | Install Android app on manager's device. Walk through UI. | 30 min |
| 14:00 | Install app on 2–3 server devices. Quick demo. | 30 min |
| 14:30 | Run system in "shadow mode" (detects but does NOT push alerts). Verify detections on manager dashboard. | 60 min |
| 15:30 | Review shadow-mode results with manager. Calibrate thresholds if needed. | 30 min |
| 16:00 | Installation complete. System in shadow mode for Day 1. | — |

### Day 1 Exit Criteria
- Edge device powered on and stable
- All camera streams ingesting
- Zone polygons defined and validated
- Manager app installed and connected
- System running in shadow mode (no push alerts yet)

---

## 4. Calibration Period (Days 2–7)

| Day | Activity |
|---|---|
| 2–3 | Shadow mode continues. Review detection accuracy with manager (1 hr/day). Adjust zone polygons and thresholds. |
| 4 | Enable push alerts for MANAGER ONLY. Manager evaluates alert quality. |
| 5 | If manager approves: enable push alerts for captain(s). |
| 6–7 | Enable push alerts for all floor staff. Monitor adoption, false positive rate, battery impact. |

### Calibration Decision Gates

| Gate | Criteria | If Not Met |
|---|---|---|
| Zone accuracy | ≥80% correct state transitions (manual audit, 1 hr sample) | Adjust polygons, camera angles, or detection model |
| False positive rate | ≤30% during calibration (relaxed from 20% target) | Adjust thresholds (increase durations, reduce sensitivity) |
| Manager satisfaction | Manager says "alerts are useful" (qualitative) | Discuss with manager, iterate on rules |
| Staff app stability | No crashes on any device during 1 full shift | Debug, patch, re-deploy |

---

## 5. Active Pilot (Weeks 3–6)

### Daily Operations
- System runs fully autonomous during all service hours
- Field-ops engineer available by phone for troubleshooting
- Remote SSH access to edge device for diagnostics
- Daily automated health check: heartbeat, camera status, alert stats

### Weekly Check-ins
- 30-min call with manager: What's working? What's annoying? Any false positives?
- Review alert stats: total, ack rate, override rate, escalation rate
- Adjust thresholds if needed (remote via config push)

### Data Collection
- All events logged to edge SQLite (auto)
- Manual baseline data: stopwatch table-turn measurements (5 tables/hr, 2 hrs/day, week 1 only)
- Cloud sync enabled for analytics (if internet available)

---

## 6. Evaluation Period (Weeks 7–8)

### Quantitative Evaluation
Compare Week 5–6 (with Sangati) vs. Week 1 baseline (or pre-Sangati CCTV audit):

| Metric | Baseline | With Sangati | Delta |
|---|---|---|---|
| Avg table-turn time (peak) | Measured | Measured | % change |
| Avg wait-to-seat time (peak) | Measured | Measured | % change |
| Dirty-table dwell time | Measured | Measured | % change |
| Alert acknowledgement rate | N/A | Measured | — |
| False positive rate | N/A | Measured | — |
| System uptime | N/A | Measured | — |
| Staff daily active usage | N/A | Measured | — |

### Qualitative Evaluation
- Manager interview (30 min): structured questionnaire
- 2–3 server interviews (15 min each): adoption, friction, value
- Owner interview (30 min): perceived value, willingness to continue, pricing sensitivity

### Evaluation Deliverable
- **Pilot Report:** 5-page summary with metrics, qualitative feedback, recommendations
- **Go/No-Go recommendation:** Continue to production? Iterate? Pivot?

---

## 7. Decommission Plan (If Pilot Fails)

| Step | Action |
|---|---|
| 1 | Export all event logs and analytics data (USB drive) |
| 2 | Uninstall Android app from all staff devices |
| 3 | Disconnect edge device from NVR |
| 4 | Remove edge device and mounting hardware |
| 5 | Restore NVR to pre-Sangati configuration (if changed) |
| 6 | Conduct exit interview with manager and owner |
| 7 | Write post-mortem with lessons learned |

---

## 8. Restaurant Onboarding Checklist (Reusable)

For scaling beyond pilot, each new restaurant deployment follows this checklist:

```
□ Restaurant assessment passed (10-point checklist)
□ Owner consent obtained
□ Edge device prepared and tested
□ CCTV access verified (RTSP streams)
□ Zone polygons configured
□ Manager app installed and trained
□ Staff apps installed (≥80% of floor staff)
□ Shadow mode: 3 days minimum
□ Calibration complete (accuracy ≥80%, FP ≤30%)
□ Manager sign-off to go live
□ Live with push alerts for 1 week
□ Week 1 review: adjust thresholds
□ Handoff to remote monitoring
```

---

## DECISIONS NEEDED

1. **Shadow mode duration:** 1 day or 3 days before enabling alerts? Depends on detection accuracy.
2. **Baseline measurement:** Manual stopwatch or CCTV playback audit? Manual is simpler but less accurate.
3. **Staff device policy:** Install on personal phones or provide dedicated devices? Cost vs. adoption tradeoff.
4. **Remote access:** VPN to edge device or direct SSH? VPN is more secure but adds setup complexity.
5. **Pilot city:** Which city? Affects language, cuisine type, restaurant layout norms, CCTV vendors.
