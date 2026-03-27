# Integrations — Sangati AI

> **Version:** Discovery v0.1 | **Date:** 2026-02-13 | **Status:** Draft
> **Local RAG sources:** None. Integration specs based on Indian restaurant infrastructure norms (ASSUMPTION).

---

## 1. CCTV / DVR Integration

### 1.1 Overview
Sangati's primary data source is the restaurant's existing CCTV infrastructure. No new cameras are required in most cases.

### 1.2 Access Modes (Priority Order)

#### Mode A: RTSP from NVR/DVR (Preferred — 70% of restaurants, ASSUMPTION)

**How it works:**
- Most Indian restaurants use IP camera systems with a centralized NVR
- Dominant brands: Hikvision, CP Plus, Dahua (90%+ market share in India — ASSUMPTION)
- NVR exposes RTSP streams per channel

**Connection:**
```
rtsp://<username>:<password>@<nvr_ip>:554/Streaming/Channels/<channel>01
```

**Setup steps:**
1. Obtain NVR IP address (usually 192.168.1.x on restaurant LAN)
2. Obtain RTSP credentials (often default: admin/admin123 — security concern to address)
3. Identify channel numbers for dining floor + entry cameras
4. Test stream with `ffprobe` from edge device
5. Configure in Sangati setup tool

**Vendor-specific RTSP URL formats:**

| Vendor | URL Pattern |
|---|---|
| Hikvision | `rtsp://user:pass@ip:554/Streaming/Channels/101` (main) / `102` (sub) |
| CP Plus | `rtsp://user:pass@ip:554/cam/realmonitor?channel=1&subtype=0` |
| Dahua | `rtsp://user:pass@ip:554/cam/realmonitor?channel=1&subtype=0` |
| Generic ONVIF | Discover via ONVIF device manager; extract RTSP URI from media profile |

**Bandwidth considerations:**
- Main stream (1080p, 15fps, H.264): ~4 Mbps per camera
- Sub stream (720p, 10fps, H.264): ~1.5 Mbps per camera
- **Recommendation:** Use sub stream for Sangati vision pipeline (sufficient for blob detection, lower CPU decode cost)

#### Mode B: Direct IP Camera (15% of restaurants, ASSUMPTION)

**When NVR is absent or inaccessible.** Some restaurants have standalone IP cameras recording to SD card.

**Connection:** Same RTSP protocol, directly to camera IP.

**Limitation:** Some cameras limit concurrent RTSP clients (often max 2). Sangati would be an additional client alongside the recording/viewing client.

#### Mode C: HDMI Capture from Analog DVR (10% of restaurants, ASSUMPTION)

**For legacy analog CCTV systems** (BNC cameras → analog DVR with HDMI output).

**Hardware needed:**
- USB HDMI capture card (e.g., Elgato Cam Link 4K or generic ~$30)
- HDMI cable from DVR's spot monitor output

**Limitations:**
- Single multiplexed view (DVR's quad/9-split display) — lower per-camera resolution
- Fixed layout — zone polygons must account for split-screen positions
- DVR OSD (date/time overlay) may interfere with detection — needs masking

**Setup steps:**
1. Connect HDMI capture card to edge device USB 3.0
2. Connect HDMI cable from DVR spot-out to capture card
3. Configure capture resolution and fps in Sangati ingest layer
4. Define zone polygons on the multiplexed view

#### Mode D: USB Camera (Fallback — Greenfield Install)

**When restaurant has no existing CCTV or CCTV is unusable.**

**Hardware:**
- USB webcam (Logitech C920 or similar): ~$50 per camera
- Ceiling/wall mount bracket
- USB extension cable (active, if >3m)

**Limitations:**
- Additional cost and installation effort
- No recording integration (restaurant loses CCTV recording unless Sangati adds it)
- Restaurant may prefer to install proper IP cameras instead

---

### 1.3 Camera Discovery Tool

For Mode A and B, Sangati should include a setup utility that:
1. Scans the LAN for ONVIF-compatible devices
2. Lists discovered cameras with IP, model, and available streams
3. Tests RTSP connectivity with provided credentials
4. Captures a snapshot for zone polygon definition

**Technology:** Python script using `python-onvif-zeep` + `ffprobe`

---

## 2. POS Integration (Optional)

### 2.1 Philosophy
POS integration is NOT required for Sangati MVP. The core value proposition works on vision alone. POS integration adds context but is a Phase 2 enhancement.

### 2.2 What POS Data Would Add

| POS Data | Sangati Enhancement |
|---|---|
| Order placed timestamp | More precise "time since order" for idle detection |
| Bill requested timestamp | Predict imminent table turnover |
| Bill paid timestamp | Trigger "ready to clear" alert (instead of waiting for guests to leave visually) |
| Table number mapping | Precise per-table alerts (instead of per-zone) |
| Item count / order size | Predict kitchen load and service duration |
| Revenue per table | Enable revenue-per-seat-hour analytics for owner |

### 2.3 Indian POS Landscape (ASSUMPTION)

| POS System | Market Presence | Integration Method |
|---|---|---|
| Petpooja | High (30%+ of mid-range restaurants) | REST API (documented) |
| POSist | Medium | REST API |
| Torqus | Medium (South India) | REST API |
| Rista | Medium | REST API |
| Custom / local vendor | High (40%+) | No API; would require database tap or screen scrape |
| No POS (manual billing) | Low-mid (20%?) | N/A — Sangati vision-only mode |

### 2.4 Integration Approach (Phase 2)

```
POS System ──[webhook or polling]──▶ Sangati POS Adapter (edge)
                                            │
                                            ▼
                                    State Layer enrichment
                                    (table state + order context)
```

**Adapter pattern:**
- Abstract `POSAdapter` interface: `getTableStatus(tableId) → { hasOrder, orderTime, billRequested, billPaid }`
- Concrete adapters per POS vendor (Petpooja, POSist, etc.)
- Polling interval: 30 seconds (or webhook if POS supports it)
- Fallback: if POS adapter fails or is unavailable, Sangati continues with vision-only mode (graceful degradation)

### 2.5 Fallback When POS Unavailable

| Feature | With POS | Without POS (Vision Only) |
|---|---|---|
| Table idle detection | Based on "time since order served" | Based on "no staff interaction in zone" |
| Table turn timing | Order-to-payment duration | Seated-to-vacant duration (vision) |
| Bill request detection | POS event | Not detectable (manual only) |
| Revenue analytics | Actual revenue data | Not available |
| Kitchen load prediction | Order count | Not available (Phase 2 with kitchen camera) |

---

## 3. QR Ordering Hooks (Optional, Not Required)

### 3.1 Context
Some restaurants (especially post-COVID) use QR-based ordering (e.g., Thrive, DotPe, Petpooja QR). These systems generate events that could enrich Sangati's state.

### 3.2 Potential Integration Points

| Event | Source | Sangati Use |
|---|---|---|
| QR scanned (menu viewed) | QR platform webhook | Mark table as "active" immediately (vs. waiting for visual idle) |
| Order placed via QR | QR platform webhook | Know that table has ordered without POS integration |
| Payment completed via QR | QR platform webhook | Trigger "table about to leave" prediction |

### 3.3 Priority
**Low.** QR ordering adoption is inconsistent. Many restaurants have QR but staff still take verbal orders. Not a reliable signal for MVP.

---

## 4. WhatsApp Business API (Owner Reports)

### 4.1 Use Case
Push daily morning report to owner via WhatsApp. Highest-adoption messaging platform in India (ASSUMPTION: 95%+ smartphone penetration).

### 4.2 Integration

| Component | Detail |
|---|---|
| Provider | WhatsApp Business API via BSP (e.g., Gupshup, Twilio, Wati) |
| Message type | Template message (pre-approved by Meta) |
| Trigger | Daily at 07:00 IST, generated by cloud analytics service |
| Content | Service score, top 3 issues, table turn avg, week-over-week trend |
| Cost | ~₹0.50–1.00 per message (ASSUMPTION) |
| Fallback | If WhatsApp delivery fails, store in app for next login |

### 4.3 Template Example
```
🔔 Sangati Daily Report — {restaurant_name}
📅 {date}

Service Score: {score}/100
🍽 Table Turns (avg): {turn_time} min (target: {target})
⏳ Wait-to-Seat (avg): {wait_time} min
📊 Alerts: {total} fired, {ack_pct}% acknowledged

Top Issue: {top_issue}

View full report: {dashboard_url}
```

---

## 5. Calendar / Reservation Integration (Phase 2)

### 5.1 Use Case
If the restaurant uses a reservation system (e.g., Dineout, EazyDiner, Google Reserve), Sangati could predict load.

### 5.2 Integration
- Pull reservation count for each service slot
- Adjust alert thresholds proactively: "Tonight has 15 reservations (vs. 8 avg) — lowering idle threshold to 6 min"
- Not required for MVP

---

## 6. Integration Priority Matrix

| Integration | MVP | Phase 2 | Phase 3 | Dependency |
|---|---|---|---|---|
| CCTV/RTSP | **Required** | — | — | Camera access, NVR credentials |
| LAN/WiFi | **Required** | — | — | Network setup |
| WebSocket (staff app) | **Required** | — | — | Edge device, Android app |
| SQLite (edge storage) | **Required** | — | — | Edge device |
| Cloud analytics API | — | **Required** | — | Cloud hosting, internet |
| WhatsApp Business API | — | **Required** | — | BSP account, Meta approval |
| POS (Petpooja, etc.) | — | **Optional** | — | POS vendor cooperation |
| QR ordering hooks | — | — | Optional | QR platform API |
| Reservation systems | — | — | Optional | Reservation platform API |
| Kitchen display (KDS) | — | **Optional** | — | Pass camera, KDS hardware |

---

## DECISIONS NEEDED

1. **CCTV access:** Has the pilot restaurant's NVR been tested for RTSP access? What brand/model?
2. **Network isolation:** Should Sangati run on the restaurant's existing LAN or a dedicated network (VLAN/separate router)?
3. **POS vendor:** Does the pilot restaurant use a POS? Which one? Is API access available?
4. **WhatsApp BSP:** Which Business Solution Provider to use? Gupshup (India-native) vs. Twilio (global)?
5. **Camera credential security:** Default NVR passwords are a security risk. Should Sangati enforce credential rotation during setup?
