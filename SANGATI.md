# SANGATI — Restaurant Operations Dashboard

Pre-service signal system for Indian restaurants. Watches operational patterns and tells the manager what is coming before it arrives. No AI. No analytics. Early warning.

All data stays on the restaurant's own device. Nothing leaves the building. Ever.

---

## File

```
SangatiDashboard.html
```

Single file. React 18 + Tailwind via CDN. No build step. Open in browser.

---

## Two Modes

Toggle button top-right switches between modes.

### Owner Mode

| Section | What it shows |
|---|---|
| Signal bar (top) | Date · Weather · Context line · Active event badge |
| 3 Signal cards (centre) | Order amount · Prep covers · Staff count — each with breakdown and reason tag |
| Savings panel (right) | Waste prevented · Over-ordering prevented · SANGATI fee · **Net in your pocket** |
| Override history (bottom) | Last 5 rows — SANGATI said vs you chose vs what happened vs accuracy % |

Each signal card has an **OVERRIDE** button. Click it → slide-in panel → enter actual number + reason → confirm. Teaches the system.

Accuracy colour coding: `≥85%` green · `70–84%` amber · `<70%` red

### Manager Mode

Full screen. Three giant numbers only (≥80px). Readable in 30 seconds while standing.

```
ORDER TODAY     PREP TONIGHT    STAFF TOMORROW
₹18,400         155 covers      12 people
```

Alert rules (hardcoded):
- Maximum 3 alerts per day
- Every alert shows: what · why it matters in ₹ · what to do
- No alerts → "No alerts today. Operations look normal."

Alert types: weather shift · cricket match · public holiday · month-end payday · unusual sales trend

---

## Sample Data

**Restaurant:** Spice Garden — Andheri West
**Context:** Saturday + payday weekend + light rain forecast evening
**Active event:** IPL match tonight (India vs Australia)

| Signal | Value |
|---|---|
| Order | ₹18,400 total |
| Prep | 155 covers |
| Staff | 12 people |

**Order breakdown:** Chicken ₹6,200 · Vegetables ₹4,100 · Rice/Dal ₹3,800 · Dairy ₹2,400 · Oils/Spices ₹1,900

**Staff breakdown:** Kitchen 5 · Floor 4 · Delivery Coord. 2 · Support 1

**Active alert:** IPL match tonight — delivery surge 35% from 7pm. Reduce dine-in prep 15%. Add delivery coordinator from 6:30pm. Impact if ignored: ₹4,200.

**Savings this month:**

| | |
|---|---|
| Waste prevented | ₹8,400 |
| Over-ordering prevented | ₹6,100 |
| Total saved | ₹14,500 |
| SANGATI fee | ₹4,999 |
| **Net in your pocket** | **₹9,501** |

---

## Design Tokens

| Token | Value |
|---|---|
| Background | `#0E0E0E` |
| Surface | `#161616` |
| Gold accent | `#C8A060` |
| Text primary | `#E8E4DC` |
| Text muted | `#666666` |
| Alert | `#C0392B` |
| Success | `#1E8449` |
| Border | `#242424` |

Typography: system fonts only (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`).
Layout target: 10-inch tablet, 1024×768 landscape.

---

## No External Dependencies at Runtime

CDN scripts load once (React 18, ReactDOM, Babel standalone, Tailwind). After that:

- No API calls
- No analytics
- No telemetry
- No data leaves the device
