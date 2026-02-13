# Persona: Kitchen Staff (Head Chef / Expeditor)

> **Local RAG sources:** None. Based on standard Indian restaurant kitchen operations (ASSUMPTION).

---

## Profile

| Attribute | Value |
|---|---|
| **Role** | Head Chef / Kitchen Expeditor / Sous Chef |
| **Age range** | 25–50 |
| **Experience** | 3–20 years in kitchen |
| **Reports to** | Floor Manager / Owner |
| **Manages** | Line cooks, prep staff, dishwashers (2–8 people — ASSUMPTION) |
| **Shift** | 09:00–15:00, 17:00–23:00 (with prep overlap) |
| **Tech comfort** | Low to medium. Uses WhatsApp. Minimal app usage during service. |
| **Device** | Personal Android phone — but NEVER on them during service (hands, grease, heat). |
| **Language** | Hindi / regional. Minimal English. |

---

## Goals

1. **Get orders out fast and correct** — speed + quality = no returns
2. **Maintain kitchen rhythm** — controlled chaos, not actual chaos
3. **Minimize wastage** — overproduction of perishable items
4. **Keep the pass moving** — plated food sitting at the pass = quality degradation
5. **Protect their team** — kitchen staff are family; they shield them from front-of-house pressure

---

## Pains

1. **No visibility into floor state.** Kitchen doesn't know: How full is the restaurant? Is a rush coming? Are tables about to order?
2. **Pass pileup.** Food sits at the pass because no server comes to pick up. Chef has no way to ping floor except shouting.
3. **Order clustering.** 8 tables order within 3 minutes. Kitchen gets slammed. No advance warning.
4. **Communication with floor is one-way.** Floor tells kitchen what to cook. Kitchen cannot tell floor "slow down seating — we're backed up."
5. **No hands for devices.** Cannot interact with phone/tablet during active cooking.

---

## Authority

- Can flag "kitchen overload" state (visible to floor manager)
- Can view pass-pickup alerts (food ready, waiting for server)
- Cannot override floor alerts
- Cannot change system mode
- Can signal "86'd" items (out of stock — ASSUMPTION: future feature, not MVP)

---

## Daily Cadence

| Time | Activity |
|---|---|
| 09:00 | Arrive. Inventory check. Prep begins. |
| 11:00 | Service starts. Cook, plate, expedite. |
| 12:00–14:00 | **RUSH.** Maximum output. Every second matters. |
| 14:00–15:00 | Wind down. Clean. Prep for dinner. |
| 17:00 | Dinner prep. Sauces, proteins, mise en place. |
| 19:00–22:00 | **RUSH.** Higher volume, complex orders (larger parties). |
| 22:00–23:00 | Close kitchen. Clean. Inventory leftover. |

---

## What They Ignore

- Anything that requires touching a screen during active cooking
- Floor-side alerts (not their domain)
- Post-shift analytics (owner/manager concern)
- Any notification that's not about THEIR immediate task (pass pickup, overload, 86)

---

## What Would Make Them Uninstall (Adoption Killers)

1. **Requires device interaction during cooking.** Hands are wet, greasy, hot. Touchscreens = impossible.
2. **More noise in an already noisy environment.** Kitchen is loud. Subtle audio alerts won't be heard.
3. **Adds tasks.** If Sangati asks the kitchen to "log" or "confirm" things, it's dead on arrival.
4. **Blames the kitchen.** If pass-pickup delays are logged as "kitchen slow," they'll reject the system.
5. **Interrupts rhythm.** Kitchen runs on muscle memory and verbal calls. Tech that disrupts flow = rejected.

---

## Sangati Value Proposition (for this persona)

> "Sangati makes sure your food gets picked up the moment it hits the pass. And it warns the floor to slow seating when you're slammed."

**Key message:** We help you get food to tables faster and prevent the floor from drowning your kitchen.

---

## Interaction Model (Kitchen-specific)

The kitchen does NOT use the phone app during service. Instead:

1. **Kitchen Display Screen (KDS) or wall-mounted tablet** at the pass
   - Shows: pass-pickup alerts (food waiting >3 min, no server pickup)
   - Shows: incoming load indicator (tables about to order based on seating time)
   - Shows: "kitchen overload" button (big physical button or single tap)
2. **Audio cues:** Distinct chime for pass-pickup alert (different from POS ticket printer sound)
3. **"Kitchen overload" signal:** Chef hits one button → manager gets alert → manager can slow seating or redirect staff to pickup

### MVP Kitchen Scope
- Pass-pickup awareness (vision: plated food at pass, no server pickup in 3 min — ASSUMPTION: requires pass-zone camera)
- Floor occupancy signal (simple: "Floor 80% full" indicator — no action required from kitchen)
- Kitchen overload button (one-tap, signals manager)

---

## DECISIONS NEEDED

1. **Does the pilot restaurant have a camera covering the kitchen pass?** If not, pass-pickup detection is out of MVP.
2. **KDS or tablet?** Does the restaurant already have a kitchen display? Can we repurpose it?
3. **Kitchen overload button:** Physical IoT button (e.g., Flic) vs. on-screen button on KDS? Physical is better for greasy hands.
4. **Is kitchen scope in MVP at all?** It could be deferred to Phase 2 to reduce pilot complexity. The core pilot wedge (table-turn awareness) doesn't require kitchen integration.
