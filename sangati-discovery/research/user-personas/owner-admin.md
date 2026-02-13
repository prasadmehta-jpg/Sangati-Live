# Persona: Owner / Admin

> **Local RAG sources:** None. Based on Indian restaurant business context (ASSUMPTION).

---

## Profile

| Attribute | Value |
|---|---|
| **Role** | Restaurant Owner / Partner / Operations Director |
| **Age range** | 35–60 |
| **Experience** | 5–25 years in F&B business |
| **Reports to** | Investors / self |
| **Manages** | Floor Manager(s), Chef, possibly multiple outlets |
| **On-site time** | 1–3 hours/day (often split across outlets — ASSUMPTION) |
| **Tech comfort** | Medium-high. Uses business WhatsApp, banking apps, some SaaS dashboards. |
| **Device** | iPhone or premium Android. Often a laptop too. |
| **Language** | English + Hindi. Comfortable with English dashboards. |

---

## Goals

1. **Revenue per seat per hour** — the core unit economics metric
2. **Consistent service quality** across shifts, even when absent
3. **Staff accountability** without being physically present
4. **Data-driven decisions** — "Should I expand? Add a shift? Hire more?"
5. **Competitive edge** — want to be seen as tech-forward, modern
6. **Reduce their own time on-site** — system should enable remote confidence

---

## Pains

1. **No visibility when away.** "What happened during Saturday dinner?" → relies on manager's verbal report (incomplete, biased).
2. **Staff issues are invisible.** Only discovers problems when customers complain (Zomato/Swiggy reviews).
3. **Gut-based decisions.** No data on actual table-turn times, wait times, zone utilization. Just "feeling."
4. **Technology graveyard.** Has bought POS systems, CCTV, loyalty cards — none integrated, most underused.
5. **Manager dependency.** Good manager = restaurant runs well. Manager quits = chaos. Wants system resilience.
6. **Can't justify costs.** Any new system must show ROI within 2–3 months or it's cut.

---

## Authority

- Full system configuration access (alert rules, thresholds, zone mapping)
- Can view all historical analytics and trends
- Can create/modify staff roles and permissions
- Can toggle autonomy modes (how much the system does vs. how much the manager decides)
- Can access multi-outlet comparison (Phase 2)
- Cannot access raw camera feeds through Sangati (privacy boundary — even for owner)

---

## Daily Cadence

| Time | Activity |
|---|---|
| 08:00 | Check messages. Review previous night's performance (if data exists). |
| 10:00 | Calls with suppliers, landlord, or partner. Admin work. |
| 12:00–13:00 | Visit restaurant during lunch rush (2–3 times/week). |
| 14:00–17:00 | Other business / meetings / second outlet. |
| 19:00–20:00 | Visit during dinner rush (2–3 times/week). |
| 22:00 | Manager calls with daily summary. |
| Weekly | Review P&L, staff issues, Zomato/Swiggy ratings, social media. |

---

## What They Ignore

- Real-time operational alerts (that's the manager's job)
- Technical implementation details
- Per-table or per-alert granularity (want aggregate trends)
- Anything that requires them to "operate" the system daily

---

## What Would Make Them Uninstall (Adoption Killers)

1. **No visible ROI in 60 days.** If they can't point to a concrete improvement (faster turns, fewer complaints, less waste), it's cancelled.
2. **Staff rebellion.** If the floor team resists and the owner has to force adoption, they'll blame the tool.
3. **High maintenance.** If the system needs frequent restarts, recalibration, or hand-holding from a tech person, it's unsustainable.
4. **Privacy blowback.** If a single customer or staff member raises a privacy concern publicly (social media), the owner will pull the plug to protect reputation.
5. **Vendor lock-in feel.** If they sense they can't leave or that pricing will increase sharply after pilot, trust erodes.
6. **Complexity.** If the owner can't explain to a friend in 1 sentence what Sangati does, they won't champion it.

---

## Sangati Value Proposition (for this persona)

> "Sangati gives you a daily score for how smoothly your restaurant ran — and shows you exactly where time and money were lost, without you being there."

**Key message:** Know what happened, why, and what to fix — from your phone, every morning.

---

## Owner Autonomy Modes (Configuration)

The owner sets the system's "autonomy level" — how much Sangati does automatically vs. defers to the manager.

| Mode | Behavior | Use Case |
|---|---|---|
| **Advisor** | Detects issues, shows on dashboard only. No push alerts. Manager pulls info when needed. | Low-trust pilot phase. "Show me it works before I let it push." |
| **Notify** | Detects + pushes alerts to staff. Staff must act. No auto-actions. | Default MVP mode. System suggests, humans act. |
| **Assist** | Detects + pushes + auto-assigns to nearest available server (based on zone). Manager can override. | Post-pilot, high-trust. Requires zone-assignment accuracy. |
| **Auto** | Full automation of alert routing + escalation. Manager only intervenes on exceptions. | Future. Requires months of validated accuracy data. |

Default: **Notify** mode. Owner can change. Manager cannot change (but can propose change to owner).

---

## Analytics the Owner Wants (Morning Report)

Daily summary pushed at 07:00 (before restaurant opens):

1. **Service Score:** Composite of table-turn time, wait-to-seat, alert response rate (0–100)
2. **Peak Performance:** "Lunch rush: 85/100. Dinner rush: 72/100." + top 3 issues
3. **Table Turns:** Actual vs. target, by zone
4. **Wait Times:** Actual vs. target
5. **Alert Summary:** Total fired / acknowledged / escalated / overridden
6. **Staff Responsiveness:** By role tier (server avg, captain avg, manager avg) — not per-individual
7. **Trend:** Week-over-week comparison
8. **DECISIONS NEEDED (from system):** "3 alerts have been overridden daily for 5 days — consider adjusting rule: idle-table-threshold."

---

## DECISIONS NEEDED

1. **Multi-outlet support:** Is the pilot owner a single-outlet or chain? Affects Phase 2 priority.
2. **Owner dashboard:** Web app vs. mobile app vs. WhatsApp morning report? Owner may prefer WhatsApp for simplicity.
3. **Staff visibility:** Can the owner see per-staff response times, or only per-role aggregates? (Privacy + union implications.)
4. **Pricing model:** Per-restaurant/month? Per-camera? Per-seat? Needs to align with ROI messaging.
5. **Data retention:** How long should historical data be kept? 30 days? 90 days? 1 year?
