# Pilot Roadmap — Sangati AI (20 Weeks)

> **Version:** Discovery v0.1 | **Date:** 2026-02-13 | **Status:** Draft
> **Local RAG sources:** None. Timeline based on standard startup execution pace.

---

## Team Assumptions (Minimal)

| Role | Commitment | Notes |
|---|---|---|
| **Full-stack engineer** | Full-time | Edge services, Android app, cloud API, rules engine |
| **CV engineer** | Full-time | Vision pipeline, model selection/training, zone detection |
| **Field-ops / product** | Part-time (→ full during pilot) | Restaurant relationships, deployment, calibration, user research |

**Alternatives:**
- If no dedicated CV engineer: use off-the-shelf YOLOv8n person detection (no custom training). Reduces accuracy ceiling but unblocks pilot.
- If no field-ops: founder does deployment personally. Slower but acceptable for 1-restaurant pilot.
- Contractor options: CV engineer can be a 3-month contract ($3-5K/month India-based — ASSUMPTION).

---

## Roadmap

### Phase 1: Foundation (Weeks 1–4)

| Week | Milestone | Deliverables | Owner | Dependencies | Decision Gate |
|---|---|---|---|---|---|
| **1** | Dev environment + architecture finalized | Edge device procured + OS imaged. Docker Compose for all services. RTSP ingest service working with test camera. | Full-stack | Edge hardware ordered + delivered | Hardware selection confirmed |
| **2** | Vision pipeline MVP | Person detection (YOLOv8n) running on edge. Blob detection + zone mapping working on test footage. Frame rate: ≥5 fps inference. | CV | Edge device, test CCTV footage | Detection accuracy ≥70% on test footage |
| **3** | State machine + rules engine | Zone state machine (EMPTY→OCCUPIED→IDLE→DIRTY→QUEUE). Rules engine evaluating default rules. Suppression (cooldown, dedup, fatigue) working. Unit tests passing. | Full-stack | Vision pipeline output | Rules engine tests pass |
| **4** | Alert routing + basic Android app | WebSocket server on edge. Android app: receive alerts, ACK/SNOOZE/DONE. LAN-only communication. | Full-stack | Rules engine output | End-to-end alert demo: camera → detection → alert → phone |

### Phase 2: Integration & Polish (Weeks 5–8)

| Week | Milestone | Deliverables | Owner | Dependencies | Decision Gate |
|---|---|---|---|---|---|
| **5** | Manager dashboard (Android) | Floor map with color-coded zones. Active alerts list. Zone mute. System mode toggle. | Full-stack | Alert routing working | Manager UI review with advisor/proxy user |
| **6** | Zone configuration tool | Web UI for zone polygon definition on camera snapshots. Saves to edge config. Drag-and-drop zone boundaries. | Full-stack | Camera RTSP working | Tool tested with real restaurant camera |
| **7** | Escalation engine + alert lifecycle | Full escalation ladder (4 tiers). Snooze logic. Override logging. Auto-resolve on vision confirmation. | Full-stack | Rules engine + routing | Escalation demo: alert → no response → captain → manager |
| **8** | Edge stability + hardening | Systemd services with auto-restart. Watchdog. SQLite WAL mode. 24-hour burn-in test. Crash recovery tested. | Full-stack + CV | All edge services | 24-hour burn-in: zero crashes, <1% frame drop |

### Phase 3: Pilot Deployment (Weeks 9–14)

| Week | Milestone | Deliverables | Owner | Dependencies | Decision Gate |
|---|---|---|---|---|---|
| **9** | Restaurant assessment + install | Pre-deployment checklist complete. Edge device installed. RTSP connected. Zones configured. | Field-ops | Pilot restaurant selected + consented | All 10 pre-deployment checks pass |
| **10** | Shadow mode + calibration | System detecting, not alerting. Review detections with manager daily. Adjust zones/thresholds. | Field-ops + CV | Installation complete | Detection accuracy ≥80% on live footage |
| **11** | Soft launch (manager + captain) | Push alerts enabled for manager and captain only. Evaluate alert quality. Iterate on rules. | Field-ops | Calibration passed | Manager says "alerts are useful" |
| **12** | Full launch (all staff) | All floor staff on the app. Full escalation active. Baseline measurement week. | Field-ops | Manager approval | ≥80% staff on app |
| **13** | Active pilot week 2 | Monitor metrics. Weekly check-in with manager. Remote threshold adjustments. | Field-ops | Full launch | Ack rate ≥50% (early benchmark) |
| **14** | Active pilot week 3–4 wrap | Continue monitoring. Collect quantitative data. Prepare for evaluation. | Field-ops | Ongoing | System stable, no critical issues |

### Phase 4: Evaluation & Decision (Weeks 15–16)

| Week | Milestone | Deliverables | Owner | Dependencies | Decision Gate |
|---|---|---|---|---|---|
| **15** | Quantitative evaluation | Compare metrics vs. baseline: table-turn, wait-to-seat, dirty-table dwell, alert stats. | Field-ops | 4 weeks of pilot data | Measurable improvement in ≥2 metrics |
| **16** | Qualitative evaluation + pilot report | Manager, server, owner interviews. 5-page pilot report. Go/no-go recommendation. | Field-ops | Interviews scheduled | **GO/NO-GO DECISION** |

### Phase 5: Iteration & Scale Prep (Weeks 17–20)

| Week | Milestone | Deliverables | Owner | Dependencies | Decision Gate |
|---|---|---|---|---|---|
| **17** | Post-pilot iteration | Fix top 3 issues from pilot feedback. Adjust rules/thresholds. Improve detection accuracy. | Full-stack + CV | Pilot report | Issues addressed |
| **18** | Cloud analytics MVP | Batch sync working. Owner morning report (WhatsApp or web). Basic trend dashboard. | Full-stack | Cloud infra provisioned | Owner receives first morning report |
| **19** | Deployment automation | Scripted edge setup. One-click zone config. APK distribution via sideload. Deployment time: <4 hours. | Full-stack | Standardized hardware | 2nd restaurant install in <4 hours |
| **20** | Scale plan + fundraise prep | Pitch deck updated with pilot data. Unit economics model. 2nd restaurant identified. Scaling roadmap (10 → 50 → 200). | Field-ops | Pilot report + metrics | Ready for next funding round / next 5 restaurants |

---

## Dependency Map

```
Week 1: Hardware ──────────────────────────────►
Week 1-2: Vision pipeline ──────► Week 3: State + Rules ──────► Week 4: Routing + App
                                                                         │
Week 5: Dashboard ◄──────────────────────────────────────────────────────┘
Week 6: Zone config tool ◄───── Camera RTSP access
Week 7: Escalation ◄───── Rules + Routing
Week 8: Stability ◄───── All services
                    │
                    ▼
Week 9: Restaurant install ──► Week 10: Shadow mode ──► Week 11-14: Pilot ──► Week 15-16: Eval
                                                                                       │
                                                                                       ▼
                                                              Week 17-20: Iterate + Scale
```

---

## Critical Path

The longest sequential dependency chain:
1. Hardware procurement (Week 1) → Vision pipeline (Week 2) → Rules engine (Week 3) → Alert routing (Week 4) → Stability testing (Week 8) → Restaurant install (Week 9)

**Total critical path: 9 weeks** from start to pilot installation.

Parallel workstreams that can overlap:
- Android app UI (Weeks 4–6) — can start with mock data while backend develops
- Zone config tool (Week 6) — independent of alert pipeline
- Cloud analytics (Week 18) — fully independent of edge development

---

## Risk-Gated Milestones

| Gate | Week | Condition | If Fails |
|---|---|---|---|
| Hardware works | 1 | Edge device boots, runs inference | Switch hardware platform (add 1 week) |
| Detection accurate enough | 2 | ≥70% on test footage | Try different model or camera angles (add 1-2 weeks) |
| End-to-end demo | 4 | Camera → alert → phone works | Debug pipeline (add 1 week, delay pilot) |
| Restaurant assessment passes | 9 | All 10 checks pass | Find different restaurant (add 1-2 weeks) |
| Calibration passes | 10 | ≥80% detection accuracy live | More calibration time or camera adjustments (add 1 week) |
| Manager approves full launch | 11 | "Alerts are useful" | Iterate on rules (add 1 week) |
| **Go/no-go decision** | **16** | **Improvement in ≥2 metrics + manager buy-in** | **Pivot, iterate, or shut down pilot** |

---

## Budget Estimate (ASSUMPTION)

| Category | Cost (₹) | Notes |
|---|---|---|
| Edge device (Jetson Orin Nano) | ₹20,000 | ~$250 |
| UPS (600VA) | ₹4,000 | If restaurant doesn't have one |
| HDMI capture card (if needed) | ₹2,500 | For analog CCTV |
| Ethernet cable + misc | ₹500 | |
| Android test devices (2×) | ₹20,000 | Budget phones for testing |
| Cloud hosting (6 months) | ₹6,000 | Minimal: 1 VM + DB |
| WhatsApp Business API (6 months) | ₹3,000 | ~30 messages/day × ₹0.50 |
| Travel/field-ops (pilot city) | ₹30,000 | 3–4 trips |
| **Hardware + infra total** | **₹86,000** | ~$1,000 |
| Engineering (3 people × 5 months) | ₹15,00,000 | ASSUMPTION: ₹1L/person/month avg |
| **Total pilot cost** | **₹15,86,000** | ~$19,000 |

---

## DECISIONS NEEDED

1. **Start date:** When does Week 1 begin? Hardware lead time?
2. **Pilot restaurant:** Selected? If not, who identifies candidates?
3. **CV engineer:** Hired? Contract? Existing team member?
4. **Budget approval:** Is ₹15–20L approved for 5-month pilot?
5. **Success criteria weighting:** Which metric matters most to the owner? Table-turn time? Wait-to-seat? Staff adoption?
