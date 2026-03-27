# Sangati AI — Discovery Phase

> Operational intelligence for restaurants. CCTV → service-pressure detection → role-aware alerts.

This repository contains the complete Discovery Phase workspace for Sangati AI: product vision, architecture, personas, workflows, a working rules-engine prototype, alert taxonomy, UX flows, deployment plan, and 20-week roadmap.

---

## Quick Start (Rules Engine Prototype)

```bash
cd prototypes/rules-engine
npm install
npm test        # 15+ unit tests covering rules, suppression, escalation, modes
npm run demo    # Simulates 10 minutes of dinner rush — prints alerts to terminal
```

---

## Repo Map

| Path | Purpose |
|---|---|
| **docs/01-vision/** | |
| `docs/01-vision/product-vision.md` | North star: pilot wedge, not-doing list, success metrics, constraints, differentiation |
| `docs/01-vision/pilot-workflows.md` | Rush-hour coordination, ACK/snooze/escalate, manager override, escalation ladder |
| **docs/02-requirements/** | |
| `docs/02-requirements/mvp-scope.md` | In-scope features, out-of-scope exclusions, user stories, acceptance criteria |
| `docs/02-requirements/tech-requirements.md` | Edge hardware, CCTV specs, network infra, staff device specs, cloud, security |
| **docs/03-architecture/** | |
| `docs/03-architecture/system-design.md` | 6-layer architecture, three-layer intelligence, data model (SQLite schema), offline-first sync |
| `docs/03-architecture/integrations.md` | CCTV/RTSP access modes, POS (optional), QR hooks, WhatsApp API, reservation systems |
| `docs/03-architecture/platform-architecture.md` | Production implementation: DVR auto-discovery, POS adapter pattern, Go agent, mDNS + MQTT, deployment |
| **docs/04-ux-flows/** | |
| `docs/04-ux-flows/manager-rush-dashboard.mmd` | Mermaid: manager dashboard interactions during rush |
| `docs/04-ux-flows/server-alert-flow.mmd` | Mermaid: server receives alert → ACK/snooze/override/escalate |
| `docs/04-ux-flows/override-broadcast.mmd` | Mermaid: override logic + broadcast alert path |
| `docs/04-ux-flows/escalation-overload.mmd` | Mermaid: full 4-tier escalation + overload scenario |
| `docs/04-ux-flows/owner-autonomy-modes.mmd` | Mermaid: Advisor → Notify → Assist → Auto mode progression |
| **docs/05-execution/** | |
| `docs/05-execution/deployment-plan.md` | Pre-deployment checklist, install-day timeline, calibration, evaluation, decommission |
| `docs/05-execution/pilot-roadmap.md` | 20-week roadmap, dependencies, decision gates, budget estimate |
| `docs/05-execution/risks-mitigations.md` | 10 risks with probability/impact, mitigations, heat map |
| **research/** | |
| `research/user-personas/manager.md` | Floor manager: goals, pains, authority, adoption killers |
| `research/user-personas/floor-server.md` | Floor server: goals, pains, tech comfort, adoption killers |
| `research/user-personas/kitchen.md` | Kitchen staff: goals, interaction model (no phone), KDS approach |
| `research/user-personas/owner-admin.md` | Owner: ROI focus, autonomy modes, morning report, analytics |
| `research/competitive-analysis.md` | Wobot, 5thru, Presto, Tablo, CrunchTime + differentiation matrix |
| **prototypes/alert-taxonomy/** | |
| `prototypes/alert-taxonomy/taxonomy.schema.json` | JSON Schema for alert definitions |
| `prototypes/alert-taxonomy/taxonomy.sample.json` | 18 alert definitions across floor, kitchen, manager, system categories |
| **prototypes/rules-engine/** | |
| `prototypes/rules-engine/src/engine.ts` | Core rules engine: evaluate, suppress, escalate |
| `prototypes/rules-engine/src/rules.ts` | 6 default rules with conditions and suppression config |
| `prototypes/rules-engine/src/taxonomy.ts` | TypeScript types for zones, states, alerts |
| `prototypes/rules-engine/src/demo.ts` | 10-minute rush simulation (runnable) |
| `prototypes/rules-engine/test/engine.test.ts` | Unit tests (15+ test cases) |
| `prototypes/rules-engine/README.md` | Rules engine quick-start and API docs |

---

## What to Do Next

### Day 1–2
1. Run the prototype (`npm test`, `npm run demo`)
2. Read `docs/01-vision/product-vision.md` — refine the pilot wedge
3. Review `research/user-personas/` — validate against real restaurant staff

### Week 1
4. Check `prototypes/alert-taxonomy/taxonomy.sample.json` — add/remove alerts
5. Review all "DECISIONS NEEDED" sections across docs
6. Select pilot restaurant and begin assessment

### Week 2–3
7. Use `docs/03-architecture/system-design.md` as build blueprint
8. Start implementing based on `docs/05-execution/pilot-roadmap.md`
9. Reference `docs/02-requirements/tech-requirements.md` for hardware procurement

### Week 4+
10. Build production system using this discovery repo as spec
11. Update "DECISIONS NEEDED" sections as choices are made
12. Use the rules engine prototype as foundation for production code

---

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| AI philosophy | AI-assisted, not autonomous | Reduce cognitive load. Fast, reliable, explainable. |
| Data source | Existing CCTV (no new hardware) | Lowest barrier to deployment |
| Detection method | Blob/zone states (non-biometric) | Privacy-first, patent-safe |
| Intelligence layer | Deterministic rules (MVP) | Predictable, explainable, no training data needed |
| Deployment model | Offline-first edge | India connectivity reality. Cloud optional. |
| Alert delivery | Push to role (not pull dashboard) | Restaurants need nudges, not dashboards |
| Privacy | No PII, no biometrics, no raw video storage | DPDP Act 2023 compliant by design |

---

## Viewing Mermaid Diagrams

The `.mmd` files in `docs/04-ux-flows/` are [Mermaid](https://mermaid.js.org/) diagrams. To view them:

- **VS Code:** Install "Mermaid Markdown" extension, open file, preview
- **GitHub:** Mermaid renders natively in `.md` files (wrap in ```mermaid blocks)
- **Web:** Paste into [mermaid.live](https://mermaid.live)

---

## Local RAG Sources

No local input files were found during generation. All domain-specific details are marked as **ASSUMPTION** where not self-evident from the product context. Validate assumptions against real restaurant observations.
