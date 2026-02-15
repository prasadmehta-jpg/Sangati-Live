# Persona: Floor Server

> **Local RAG sources:** None. Based on standard Indian restaurant operations (ASSUMPTION).

---

## Profile

| Attribute | Value |
|---|---|
| **Role** | Floor Server |
| **Age range** | 18–30 |
| **Experience** | 0–5 years (high turnover) |
| **Reports to** | Captain → Floor Manager |
| **Manages** | No one. Responsible for 3–5 tables in assigned zone. |
| **Shift** | Split or single: varies. Often 10:00–15:00 + 18:00–23:00. |
| **Tech comfort** | High for social media / WhatsApp. Low for business tools. |
| **Device** | Personal Android phone (budget to mid-range: Redmi, Realme, Samsung M-series — ASSUMPTION). |
| **Language** | Hindi primary. Limited English. May speak regional language (Marathi, Tamil, Telugu). |

---

## Goals

1. **Get through the rush** without getting yelled at by captain or manager
2. **Earn tips** (in tip-friendly restaurants) by providing good service
3. **Minimize physical trips** — efficiency = less exhaustion
4. **Avoid complaints** that get attributed to them personally
5. **Go home on time** — no extended shifts because service went sideways

---

## Pains

1. **Invisible tables:** Cannot see their zone when at the kitchen pass or billing counter. Miss idle tables.
2. **Conflicting priorities:** Manager says "attend Table 7" while kitchen says "pick up Table 3's order NOW."
3. **No system of record:** If they attend a table but nobody sees, they get blamed anyway.
4. **Communication chaos:** Shouting across the floor, hand signals, walkie-talkie cross-talk.
5. **Phone restrictions:** Many restaurants ban phones on the floor. How will they see alerts?
6. **Training gap:** New servers don't know the "rules" (how long is too long for a table to wait). Experienced servers rely on instinct.

---

## Authority

- Can acknowledge or snooze alerts for their assigned zone
- Can mark tasks as done
- Can flag false positives (OVERRIDE: NOT VALID)
- Cannot mute zones or change system mode
- Cannot see other servers' zones (unless captain-level)
- Cannot change their zone assignment

---

## Daily Cadence

| Time | Activity |
|---|---|
| 10:00 | Arrive. Set up tables. Check station (cutlery, menus, condiments). |
| 11:00 | Service starts. Take orders, serve, clear. |
| 12:00–14:00 | **RUSH.** Constant motion. 15–25 table interactions/hour. |
| 14:00–15:00 | Wind down. Reset tables. Eat staff meal. |
| 15:00–18:00 | Off (or stay for prep if short-staffed). |
| 18:00 | Dinner setup. Brief from captain on specials, VIPs. |
| 19:00–22:00 | **RUSH.** Higher intensity. Larger parties. |
| 22:00–23:00 | Close tables. Clean zone. Cash out tips. |

---

## What They Ignore

- Anything that looks like a "management tool" — they assume it tracks them
- Alerts about zones that aren't theirs
- Any notification longer than ~8 words
- Post-shift feedback or reports — they want to leave
- Anything that requires typing or data entry

---

## What Would Make Them Uninstall (Adoption Killers)

1. **Feels like being tracked.** "They're tracking how fast I respond" → immediate rejection.
2. **Too many alerts.** If they get pinged every 2 minutes, they'll silence the app.
3. **Requires their personal phone + data.** If Sangati drains battery or uses mobile data (no WiFi), they won't tolerate it.
4. **Manager weaponizes it.** If alert response times are used for punishment, staff will game the system or quit.
5. **Doesn't help THEM.** If it only helps the manager and adds work for the server, adoption = 0.
6. **Peers aren't using it.** Social proof matters. If half the staff ignores it, the rest will too.

---

## Sangati Value Proposition (for this persona)

> "Sangati tells you exactly which table needs you next — no guessing, no getting yelled at. It's like having a captain who always has your back."

**Key message:** This helps YOU avoid mistakes and stay on top of your zone effortlessly.

---

## Design Implications

- Alerts must be **extremely short** (≤8 words): "Table 7: clear plates now"
- UI must work one-handed while carrying plates
- Large tap targets (ACK/DONE buttons ≥ 48dp)
- Minimal battery impact: no background GPS, no continuous polling
- Must work on Android 10+ with 2GB RAM (budget phones — ASSUMPTION)
- Consider smartwatch / wrist-buzzer as alternative to phone

---

## DECISIONS NEEDED

1. **Phone policy:** Do pilot restaurants allow phones on the floor? If not, alternative: wrist device? Dedicated cheap Android device?
2. **Language:** Hindi-first alerts or English-first? Can we detect phone language and auto-switch?
3. **Incentive model:** Should good alert-response times earn server recognition? Or is gamification risky (staff-tracking perception)?
4. **Data usage:** Will the app work on LAN-only (no mobile data cost to server)?
