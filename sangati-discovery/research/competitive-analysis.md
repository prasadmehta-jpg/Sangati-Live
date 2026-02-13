# Competitive Analysis — Sangati AI

> **Version:** Discovery v0.1 | **Date:** 2026-02-13 | **Status:** Draft
> **Local RAG sources:** None. Competitor data based on publicly available information and industry knowledge (ASSUMPTION where noted).

---

## 1. Competitive Landscape Map

```
                    ┌─────────────────────────────┐
                    │      Real-Time Ops          │
                    │      (Push Alerts)          │
                    │                             │
                    │    ★ SANGATI (target)        │
                    │                             │
         ┌──────── │ ─────────────────────────────│────────┐
         │         │                             │         │
  Vision │         │                             │         │ Manual
  Based  │         │                             │         │ Input
         │         │                             │         │
         │         │                             │         │
         └──────── │ ─────────────────────────────│────────┘
                    │                             │
                    │   Most competitors          │
                    │   are here (dashboards      │
                    │   + manual input)           │
                    │                             │
                    │      Retrospective          │
                    │      (Pull Dashboards)      │
                    └─────────────────────────────┘
```

Sangati occupies a unique position: **vision-based + real-time push**. Most competitors are either retrospective dashboards or require manual data input.

---

## 2. Direct Competitors

### 2.1 Presto (now TableUp / PAR Technology)

| Aspect | Detail |
|---|---|
| **What they do** | Tabletop tablets for ordering + table-turn analytics |
| **Geography** | US-focused, some international |
| **Data source** | POS integration + tabletop device (manual) |
| **Real-time ops?** | Limited. Mostly retrospective analytics. |
| **Vision-based?** | No |
| **Pricing** | Per-device/month (ASSUMPTION: $50–100/table/month) |
| **Sangati differentiation** | Sangati requires zero per-table hardware, works with existing CCTV, and pushes alerts. Presto requires hardware at every table. |

### 2.2 5thru / QSR Automations

| Aspect | Detail |
|---|---|
| **What they do** | Drive-thru optimization using cameras + AI |
| **Geography** | US QSR (quick-service) chains |
| **Data source** | Dedicated cameras at drive-thru |
| **Real-time ops?** | Yes — drive-thru specific |
| **Vision-based?** | Yes |
| **Pricing** | Enterprise SaaS (ASSUMPTION: $500+/location/month) |
| **Sangati differentiation** | 5thru is QSR drive-thru only. Sangati targets dine-in table service. Different problem, different market. |

### 2.3 Wobot Intelligence (India)

| Aspect | Detail |
|---|---|
| **What they do** | AI video analytics for compliance, safety, and operations across retail/F&B/manufacturing |
| **Geography** | India-based, expanding globally |
| **Data source** | Existing CCTV (similar to Sangati) |
| **Real-time ops?** | Yes — real-time alerts for compliance violations |
| **Vision-based?** | Yes |
| **Pricing** | Per-camera/month (ASSUMPTION: ₹2,000–5,000/camera/month) |
| **Key difference** | Wobot focuses on compliance (hand-washing, PPE, SOP adherence). Broad industry. Not restaurant-ops specific. |
| **Sangati differentiation** | Sangati is purpose-built for restaurant service flow (table states, alert routing, escalation). Wobot is horizontal. Sangati's role-based alert routing and escalation ladder don't exist in Wobot. |

### 2.4 Drishti Technologies

| Aspect | Detail |
|---|---|
| **What they do** | Action recognition AI for manufacturing assembly lines |
| **Geography** | US + India |
| **Data source** | Dedicated cameras at workstations |
| **Real-time ops?** | Yes — cycle time, error detection |
| **Vision-based?** | Yes |
| **Pricing** | Enterprise (ASSUMPTION: $1,000+/station/month) |
| **Sangati differentiation** | Drishti is manufacturing. Different domain entirely. But validates the "CV for ops intelligence" approach. |

---

## 3. Indirect Competitors (Dashboard / Analytics Tools)

### 3.1 Tablo (Restaurant Analytics)

| Aspect | Detail |
|---|---|
| **What they do** | POS-connected analytics dashboard (sales, menu performance, labor) |
| **Data source** | POS integration |
| **Real-time?** | Near real-time (POS dependent) |
| **Vision?** | No |
| **Sangati differentiation** | Tablo is retrospective and requires POS. Cannot detect service pressure. |

### 3.2 CrunchTime (Restaurant Operations Platform)

| Aspect | Detail |
|---|---|
| **What they do** | Inventory, labor, food cost management for restaurant chains |
| **Geography** | US chains (McDonald's, Wendy's, etc.) |
| **Data source** | POS + inventory systems + labor scheduling |
| **Real-time?** | No — batch analytics |
| **Vision?** | No |
| **Sangati differentiation** | CrunchTime is back-office. Sangati is front-of-house operations. |

### 3.3 Zenput / Crunchtime (Task Management)

| Aspect | Detail |
|---|---|
| **What they do** | Digital task/checklist management for restaurant teams |
| **Data source** | Manual input by staff |
| **Real-time?** | Manual triggers only |
| **Vision?** | No |
| **Sangati differentiation** | Zenput requires staff to manually log tasks. Sangati detects issues automatically. |

---

## 4. Emerging / Adjacent Players

### 4.1 Plainsight (Visual AI Platform)

- General-purpose visual AI platform (build custom CV models)
- Not restaurant-specific, but could be used to build similar solutions
- Threat level: low (platform, not product)

### 4.2 Viana (People Flow Analytics)

- Retail foot traffic analytics using existing cameras
- Heatmaps, dwell time, traffic patterns
- Not restaurant-ops focused, but overlapping technology
- No alert routing or service flow management

### 4.3 Restaurant365

- Accounting + operations platform for restaurants
- POS-dependent, retrospective, no vision
- Large installed base in US chains

---

## 5. Competitive Differentiation Matrix

| Capability | Sangati | Wobot | 5thru | Presto | Tablo | CrunchTime |
|---|---|---|---|---|---|---|
| Uses existing CCTV | ✅ | ✅ | ❌ (dedicated) | ❌ | ❌ | ❌ |
| No POS required | ✅ | ✅ | N/A | ❌ | ❌ | ❌ |
| Real-time push alerts | ✅ | ✅ | ✅ | Limited | ❌ | ❌ |
| Role-based routing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Escalation ladder | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Table-turn optimization | ✅ | ❌ | ❌ | ✅ | Partial | ❌ |
| Queue detection | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Offline-first (edge) | ✅ | ❌ (cloud) | ❌ (cloud) | ❌ | ❌ | ❌ |
| Privacy-first (no biometrics) | ✅ | Partial | Partial | ✅ | ✅ | ✅ |
| India market focus | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Restaurant-specific | ✅ | ❌ (horizontal) | QSR only | ✅ | ✅ | ✅ |
| Per-table hardware required | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## 6. Sangati's Unique Position

### What no one else does:
1. **Vision-to-role-aware-alert pipeline** — from CCTV blob detection to "this specific server needs to act NOW"
2. **Escalation ladder with auto-escalation** — no competitor has built-in operational escalation
3. **Offline-first edge deployment** — critical for India's connectivity reality. Wobot and others require cloud.
4. **Zero new hardware for restaurants** — uses what they already have (CCTV + phones)
5. **Non-biometric by design** — not a surveillance tool, a service-pressure tool

### Competitive moat (potential, not proven):
- **Data flywheel:** Every restaurant generates state-transition data that improves threshold calibration → better alerts → more adoption
- **Operational know-how:** Deep understanding of Indian restaurant service flows → hard for horizontal CV platforms to replicate
- **Edge-native architecture:** Cloud competitors cannot match offline reliability

---

## 7. Risks from Competitors

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Wobot adds restaurant-specific features | Direct competitor in India | Medium | High | Move fast on pilot. Build ops expertise moat. |
| POS vendors add CV features | Petpooja, POSist | Low | Medium | POS vendors lack CV expertise. Years away. |
| Global player enters India | 5thru, Plainsight | Low | Medium | India market requires local ops knowledge. |
| CCTV vendors (Hikvision) add analytics | Adjacent player | Medium | Medium | Camera vendors build generic analytics, not restaurant-ops. |
| Restaurant chains build in-house | Large QSR chains | Low | Low | Only feasible for 100+ unit chains. Our market is independent restaurants. |

---

## DECISIONS NEEDED

1. **Wobot positioning:** Are we competing with Wobot or adjacent? Should we engage their customers or avoid overlap?
2. **Pricing strategy:** Wobot charges per-camera. Should Sangati charge per-restaurant (simpler) or per-camera (industry norm)?
3. **Initial market:** Independent restaurants (fragmented, harder sales, but less competition) vs. small chains (5–20 outlets, faster deployment, but may already use Wobot)?
4. **Build vs. integrate:** Should Sangati build its own vision pipeline or partner with a platform like Plainsight for the CV layer?
