# Persona: Floor Manager

> **Local RAG sources:** None. Based on standard Indian restaurant operations (ASSUMPTION).

---

## Profile

| Attribute | Value |
|---|---|
| **Role** | Floor Manager / Restaurant Manager |
| **Age range** | 28–45 |
| **Experience** | 5–15 years in F&B |
| **Reports to** | Owner / Area Manager |
| **Manages** | 1–2 Captains, 4–8 floor servers, coordinates with kitchen |
| **Shift** | Split or full: 11:00–15:00, 18:00–23:00 (ASSUMPTION) |
| **Tech comfort** | Medium. Uses WhatsApp, basic POS, maybe a dashboard. Not a power user. |
| **Device** | Personal Android phone (mid-range). May have a restaurant-issued tablet. |
| **Language** | Hindi + English mix. Reads English UI but prefers Hindi alerts. |

---

## Goals

1. **Zero customer complaints** about wait times during peak service
2. **Maximize table turns** without rushing guests (balance hospitality vs. throughput)
3. **Keep staff coordinated** without micromanaging — maintain authority without hovering
4. **Impress the owner** with smooth operations and growing revenue
5. **Avoid surprises** — know about problems before customers escalate

---

## Pains

1. **Blind spots:** Cannot physically see all zones simultaneously. Relies on captains relaying info, which is delayed and lossy.
2. **Alert fatigue from current methods:** Staff walkie-talkies are noisy, chaotic during rush. Important info gets lost.
3. **Inconsistent staff performance:** New servers miss cues (idle tables, dirty tables). Training takes weeks.
4. **No real data:** "How was tonight?" → gut feel. Cannot defend decisions to owner with numbers.
5. **Firefighting mode:** Spends 80% of rush reacting, 0% preventing. Wants early warning.
6. **Technology distrust:** Has seen POS systems crash, tablets break, apps freeze. Skeptical of any new tech unless it's rock-solid.

---

## Authority

- Can override any alert or mute any zone
- Can change system mode (FULL / QUIET / OFF)
- Can reassign zone-to-server mappings mid-shift
- Can approve/deny escalation suggestions
- Cannot change alert rules (owner/admin level)
- Cannot access raw camera feeds through Sangati (privacy boundary)

---

## Daily Cadence

| Time | Activity |
|---|---|
| 10:30 | Arrive. Check reservations, staff roster, any issues from morning prep. |
| 11:00 | Lunch service starts. Monitor floor. Handle VIP tables personally. |
| 12:00–14:00 | **RUSH.** Moving constantly. Directing traffic. Resolving complaints. |
| 14:00–15:00 | Wind down lunch. Quick debrief with captain. Eat. |
| 15:00–18:00 | Off or admin (inventory, scheduling, owner calls). |
| 18:00 | Dinner shift. Pre-service briefing with staff. |
| 19:00–22:00 | **RUSH.** Same intensity. Possibly higher covers. |
| 22:00–23:00 | Close out. Cash reconciliation. Brief staff. |

---

## What They Ignore

- Long reports or dashboards with 10+ metrics — no time during rush
- Notifications that require >2 taps to understand
- Alerts about things they can already see (e.g., "Table 1 occupied" when they seated the guests themselves)
- Any system that requires them to "check in" or "log" things manually during service
- Post-shift analytics unless specifically asked by owner

---

## What Would Make Them Uninstall (Adoption Killers)

1. **False alerts during rush.** If the system cries wolf 3 times in one rush hour, they will mute it permanently.
2. **Slows them down.** If acting on an alert takes >5 seconds (open app, read, understand, act), they'll ignore it.
3. **Undermines their authority.** If staff get alerts that bypass the manager or make the manager look uninformed, they'll resist.
4. **Crashes or freezes.** One freeze during a Saturday night rush = permanent distrust.
5. **Owner surveillance.** If they perceive Sangati as the owner watching them (not helping them), they'll sabotage adoption.
6. **Battery drain.** If the app kills their phone battery by 20:00, it's gone.

---

## Sangati Value Proposition (for this persona)

> "Sangati is your extra pair of eyes. It sees the zones you can't, and tells the right person to act — so you can focus on the guests in front of you."

**Key message:** This is YOUR tool, not the owner's surveillance. It makes YOU look good.

---

## DECISIONS NEEDED

1. Is the manager the primary Sangati champion, or does adoption need to be owner-driven (top-down)?
2. Should the manager see a dashboard during rush, or ONLY receive push alerts? (Dashboard = pull model = may not look during rush.)
3. What's the manager's tolerance for setup time? (Zone mapping, staff assignment — daily task or one-time?)
