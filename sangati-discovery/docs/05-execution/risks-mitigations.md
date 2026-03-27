# Risks & Mitigations — Sangati AI

> **Version:** Discovery v0.1 | **Date:** 2026-02-13 | **Status:** Draft
> **Local RAG sources:** None.

---

## Risk Register

### R1: CCTV Incompatibility

| Attribute | Detail |
|---|---|
| **Category** | Technical |
| **Probability** | Medium (30%) |
| **Impact** | Critical — no CCTV access = no product |
| **Description** | Pilot restaurant's CCTV system may not support RTSP, or NVR may be locked down, or cameras may be analog-only with no digital output. |
| **Indicators** | Cannot connect to RTSP during assessment; NVR vendor requires proprietary software; BNC-only cameras. |
| **Mitigation** | 1. Assessment checklist verifies RTSP before commitment. 2. HDMI capture card fallback for analog DVR. 3. USB camera fallback for worst case. 4. Reject restaurants with no viable camera access (selection criteria). |
| **Owner** | Field-ops |
| **Contingency cost** | ₹2,500–5,000 per HDMI capture card; ₹10,000–15,000 for USB cameras if greenfield. |

---

### R2: Poor Detection Accuracy

| Attribute | Detail |
|---|---|
| **Category** | Technical |
| **Probability** | Medium (40%) |
| **Impact** | High — false positives destroy adoption |
| **Description** | Blob detection may be unreliable in real restaurant conditions: dim lighting, reflections, obstructions (pillars, plants), moving shadows, overlapping people. |
| **Indicators** | Detection accuracy <70% during calibration; frequent false zone-state transitions. |
| **Mitigation** | 1. Use well-validated model (YOLOv8n, pre-trained on COCO). 2. Conservative thresholds (longer durations before alerting). 3. Zone polygon adjustment to avoid occlusion areas. 4. Camera angle optimization during install. 5. Shadow mode calibration before live launch. |
| **Owner** | CV engineer |
| **Contingency** | Fine-tune model on restaurant footage (adds 2–3 weeks). Camera repositioning (requires restaurant owner cooperation). |

---

### R3: Staff Adoption Failure

| Attribute | Detail |
|---|---|
| **Category** | Adoption / behavioral |
| **Probability** | High (50%) |
| **Impact** | Critical — no adoption = no pilot data = no product |
| **Description** | Floor staff may refuse to install app, ignore alerts, or actively sabotage (silence phone, don't carry phone). Reasons: privacy fear, phone battery concerns, extra work perception, peer pressure against adoption. |
| **Indicators** | <50% daily active users after week 2; ack rate <30%; staff verbal complaints. |
| **Mitigation** | 1. Manager champion drives adoption (not forced by owner/tech). 2. Frame as "helps YOU" not "monitors YOU." 3. No per-staff performance scoring in MVP. 4. Demonstrate value to 2–3 enthusiastic servers first (social proof). 5. Address battery + data concerns (LAN-only, minimal battery). 6. Consider dedicated cheap device if personal phone is rejected. |
| **Owner** | Field-ops + manager |
| **Contingency** | Fallback to manager-only mode (only manager uses Sangati). Reduces value but still provides data. |

---

### R4: Alert Fatigue

| Attribute | Detail |
|---|---|
| **Category** | Product / UX |
| **Probability** | High (50%) |
| **Impact** | High — staff mutes app → adoption dies |
| **Description** | Too many alerts, especially false positives, will cause staff to silence notifications. The system becomes invisible. |
| **Indicators** | Override rate >30%; snooze rate >40%; staff reports "too many alerts." |
| **Mitigation** | 1. Built-in suppression: cooldowns, dedup, fatigue limits. 2. Conservative initial thresholds (fewer alerts, even if some issues are missed). 3. Manager can mute zones and switch to QUIET mode. 4. Weekly threshold review during pilot. 5. Alert taxonomy designed for specificity (not generic "attention needed"). |
| **Owner** | Full-stack + field-ops |
| **Contingency** | Reduce active rule set to 3–4 most critical alerts. Better to alert on 3 things well than 10 things poorly. |

---

### R5: Privacy Backlash

| Attribute | Detail |
|---|---|
| **Category** | Legal / reputational |
| **Probability** | Low (15%) |
| **Impact** | Critical — one public complaint could kill the product |
| **Description** | Staff or customers perceive Sangati as a staff-tracking tool. Social media post, legal complaint, or media coverage. Despite no biometric data, the perception of "AI watching" is enough. |
| **Indicators** | Staff or customer complaints about cameras/AI; social media mentions; legal notice. |
| **Mitigation** | 1. No biometric data, ever. No face-based identification. No individual tracking. 2. Privacy-by-design: raw frames never stored. 3. Signage in restaurant: "AI-assisted service optimization in use. No personal data collected." 4. Staff informed and consented during onboarding. 5. Owner briefed on privacy messaging. 6. DPDP Act 2023 compliance by default (no personal data collected). 7. Position as "service-pressure intelligence" not staff-tracking. |
| **Owner** | Founder / legal |
| **Contingency** | Immediate: disable system, issue statement. Long-term: privacy audit by third party. |

---

### R6: Edge Device Hardware Failure

| Attribute | Detail |
|---|---|
| **Category** | Technical / operational |
| **Probability** | Low (10%) |
| **Impact** | Medium — system offline until replacement, ops revert to manual |
| **Description** | Edge device fails due to heat (Indian summers: 40–45°C), power surge, SD card corruption, or manufacturing defect. |
| **Indicators** | Device stops responding; heartbeat fails; no camera feed. |
| **Mitigation** | 1. UPS for power surge protection. 2. NVMe storage (not SD card) for reliability. 3. Fanless design or adequate ventilation. 4. Placement in ventilated area (not in direct sunlight or near kitchen). 5. Pre-staged spare device for quick swap (ship within 24 hours). 6. USB recovery image for reflash. |
| **Owner** | Full-stack + field-ops |
| **Contingency cost** | ₹20,000 for spare device. Swap time: 1 hour on-site. |

---

### R7: Network Instability During Rush

| Attribute | Detail |
|---|---|
| **Category** | Technical |
| **Probability** | Medium (35%) |
| **Impact** | Medium — alerts delayed or not delivered to phones |
| **Description** | Restaurant WiFi congested during peak hours (guest phones, POS terminals, music streaming). Staff phones may lose WebSocket connection. |
| **Indicators** | Alert delivery latency >10s; frequent WebSocket reconnections; staff reports "missed alerts." |
| **Mitigation** | 1. Dedicated WiFi SSID/AP for Sangati devices (5 GHz band). 2. WebSocket auto-reconnect with 2-second retry. 3. Queued alerts delivered on reconnect (5-min window). 4. Fallback: wired display on manager station. 5. Minimal data transfer (alerts are <1 KB each). |
| **Owner** | Full-stack + field-ops |
| **Contingency cost** | ₹2,000 for dedicated WiFi AP. |

---

### R8: Restaurant Closes or Changes Ownership

| Attribute | Detail |
|---|---|
| **Category** | Business / external |
| **Probability** | Low (10%) |
| **Impact** | High — pilot aborted, data lost |
| **Description** | Indian restaurant industry has high turnover. Pilot restaurant may close, change management, or undergo renovation during pilot. |
| **Indicators** | Owner mentions financial difficulty; lease issues; renovation plans. |
| **Mitigation** | 1. Select financially stable restaurant for pilot. 2. Have backup restaurant identified. 3. Short deployment time (2 weeks to install) allows quick pivot. 4. Portable hardware (edge device moves to new restaurant). |
| **Owner** | Field-ops / founder |

---

### R9: Competitor Moves into Restaurant Ops

| Attribute | Detail |
|---|---|
| **Category** | Market |
| **Probability** | Low-Medium (20%) |
| **Impact** | Medium — competitive pressure, not immediate threat |
| **Description** | Wobot Intelligence (India CV platform) or a POS vendor adds restaurant-specific features before Sangati establishes market presence. |
| **Indicators** | Competitor announces restaurant features; pilot restaurant approached by competitor. |
| **Mitigation** | 1. Move fast — 20-week roadmap to production. 2. Deep ops expertise moat (role-based routing, escalation — hard to replicate). 3. Offline-first architecture (competitor likely cloud-first). 4. Lock in pilot restaurant as reference customer. |
| **Owner** | Founder |

---

### R10: Regulatory Change (Privacy Law)

| Attribute | Detail |
|---|---|
| **Category** | Legal / regulatory |
| **Probability** | Low (5%) |
| **Impact** | Medium-High — may require architecture changes |
| **Description** | India's DPDP Act 2023 rules are still being finalized. New rules could impose stricter requirements on CCTV-derived data or AI in workplaces. |
| **Indicators** | DPDP Act rules published; industry groups issue guidelines on workplace AI. |
| **Mitigation** | 1. Architecture already privacy-maximizing (no PII, no biometrics, edge processing). 2. Monitor regulatory developments. 3. Maintain ability to disable specific features quickly. 4. Legal review before scaling beyond pilot. |
| **Owner** | Founder / legal advisor |

---

## Risk Heat Map

```
                IMPACT
        Low      Medium     High      Critical
     ┌─────────┬──────────┬─────────┬───────────┐
High │         │          │ R4      │ R3        │
     │         │          │ Alert   │ Staff     │
     │         │          │ Fatigue │ Adoption  │
PROB ├─────────┼──────────┼─────────┼───────────┤
Med  │         │ R7       │ R9      │ R1, R2    │
     │         │ Network  │ Compet. │ CCTV,     │
     │         │          │         │ Detection │
     ├─────────┼──────────┼─────────┼───────────┤
Low  │         │ R6, R8   │ R10     │ R5        │
     │         │ HW, Biz  │ Reg.    │ Privacy   │
     └─────────┴──────────┴─────────┴───────────┘
```

---

## Top 3 Risks to Address Before Pilot

1. **R3 (Staff Adoption):** Highest probability × critical impact. Mitigation starts with manager champion selection. No tech fix — this is a human problem.
2. **R2 (Detection Accuracy):** Directly affects R4 (alert fatigue). Must validate on real restaurant footage before deployment.
3. **R4 (Alert Fatigue):** Even with good detection, too many alerts kills adoption. Conservative thresholds + suppression are non-negotiable.

---

## DECISIONS NEEDED

1. **Spare hardware budget:** Approve ₹20,000 for pre-staged spare edge device?
2. **Dedicated WiFi AP:** Include in standard deployment kit, or only if assessment reveals WiFi issues?
3. **Legal review:** Should a lawyer review the privacy setup before pilot, or after pilot proves value?
4. **Staff incentive:** Offer any incentive for pilot staff (e.g., ₹500/month stipend for participating)?
5. **Insurance:** Product liability insurance for the edge device (fire, electrical damage)?
