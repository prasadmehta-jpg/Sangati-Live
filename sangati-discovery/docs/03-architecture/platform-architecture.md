# Platform Architecture — Sangati AI

> **Version:** Discovery v0.2 | **Date:** 2026-02-16 | **Status:** Draft
> **Extends:** `docs/03-architecture/system-design.md` (conceptual architecture) and `docs/03-architecture/integrations.md` (integration points)
> **Scope:** Production-grade implementation detail — protocols, libraries, code patterns, deployment strategy

---

## 1. DVR/NVR Auto-Discovery Pipeline

A zero-configuration camera discovery system combining **four protocols in parallel**, completing in under 10 seconds on a typical restaurant /24 network.

### 1.1 Phase 1 — Fast Discovery (parallel, ~3 seconds)

Simultaneously broadcast:
1. **ONVIF WS-Discovery** — SOAP-over-UDP multicast to `239.255.255.250:3702`
2. **UPnP/SSDP** — M-SEARCH on port 1900
3. **mDNS** — Browse on port 5353
4. **ARP scan** — Full local subnet

ONVIF is the primary method — devices respond with their service endpoint (e.g., `http://192.168.1.100:80/onvif/device_service`). ARP scanning returns all IP+MAC pairs in 2–5 seconds, enabling immediate manufacturer identification via **MAC OUI lookup** against the IEEE database. Hikvision alone has 81+ registered OUI prefixes; Dahua, Axis, Reolink, and Amcrest each have distinct ranges.

### 1.2 Phase 2 — Device Identification (~5 seconds)

For each candidate IP, probe well-known ports:

| Port | Protocol / Brand |
|------|-----------------|
| 554 | RTSP (universal) |
| 8000 | Hikvision SDK |
| 37777 | Dahua binary protocol |
| 34567 | XMeye / generic DVRs |
| 80/443 | Web UI |

HTTP server headers provide brand fingerprints — Hikvision returns `Server: DVRDVS-Webs`, Dahua returns `Server: RPC/2.0` with realm containing `DH_`. The unauthenticated ONVIF call `GetSystemDateAndTime` confirms ONVIF capability without credentials.

### 1.3 Phase 3 — Stream Enumeration

Once a device is identified, obtain RTSP streams through two paths:

**Preferred:** ONVIF `GetProfiles` → `GetStreamUri(ProfileToken)` returns the RTSP URI.

**Fallback:** Construct brand-specific RTSP URLs directly:

| Brand | Main Stream Pattern | Sub-Stream Pattern |
|-------|--------------------|--------------------|
| Hikvision | `rtsp://user:pass@IP:554/Streaming/Channels/101` | `.../Channels/102` |
| Dahua/Amcrest | `rtsp://user:pass@IP:554/cam/realmonitor?channel=1&subtype=0` | `...&subtype=1` |
| Reolink | `rtsp://user:pass@IP:554/h264Preview_01_main` | `...01_sub` |
| Uniview | `rtsp://user:pass@IP:554/unicast/c1/s1/live` | `.../c1/s2/live` |
| Axis | `rtsp://user:pass@IP:554/axis-media/media.amp` | `?resolution=640x480` |

> See `docs/03-architecture/integrations.md#cctv--dvr-integration` for vendor-specific connection details and Indian market context.

**Always use sub-streams** (640×480, 512Kbps–1Mbps) for AI analysis and multi-camera grid views. Main streams (1080p/4K, 4–8 Mbps) should only be pulled on demand for focused single-camera views. Critical for restaurant bandwidth conservation.

### 1.4 ONVIF Profile Support

- **Profile S** — mandatory baseline. Guarantees `GetProfiles` and `GetStreamUri` availability.
- **Profile T** — adds H.265 support.
- **Do NOT rely on ONVIF for motion detection, analytics, or advanced features** — poor cross-brand compliance.
- For brand-specific capabilities (recording search, vendor-specific events), use proprietary APIs: Hikvision's ISAPI (`GET /ISAPI/Streaming/channels`), Dahua's CGI API (`GET /cgi-bin/configManager.cgi`).

### 1.5 Credential Handling

Waterfall approach:
1. Try unauthenticated ONVIF
2. Try brand-specific defaults (identified via MAC OUI)
3. Prompt user with discovered device's brand, model, and IP

Modern Hikvision and Dahua devices require password creation on first use — defaults are unreliable. Store validated credentials in the OS keychain (Windows DPAPI, macOS Keychain) encrypted with AES-256.

### 1.6 Key Libraries

| Language | ONVIF | mDNS | SSDP |
|----------|-------|------|------|
| Go | `0x524a/onvif-go` | `grandcat/zeroconf` | `koron/go-ssdp` |
| Python | `python-onvif-zeep` | `python-zeroconf` | built-in |

Reference implementation for RTSP brute-force scanning: **Cameradar** (Go, open-source).

---

## 2. Universal POS Integration via Adapter Pattern

### 2.1 Market Coverage

| POS | Market Share (est.) | Cumulative |
|-----|-------------------|------------|
| Square | ~28% | 28% |
| Toast | ~24% | 52% |
| Clover | ~8% | 60% |
| NCR Aloha | ~6% | 66% |
| Lightspeed | ~4% | 70% |
| Revel | ~3% | 73% |
| Others (long tail) | ~27% | 100% |

### 2.2 Adapter Interface

All POS systems have a dedicated adapter implementing a common interface. All adapters normalize transactions into a canonical data model:

```typescript
interface POSAdapter {
  connect(credentials: POSCredentials): Promise<Connection>;
  subscribeToOrders(callback: (order: CanonicalOrder) => void): void;
  getHistoricalOrders(start: Date, end: Date): Promise<CanonicalOrder[]>;
  getMenu(): Promise<CanonicalMenu>;
  getConnectionStatus(): ConnectionStatus;
}
```

The canonical order schema captures: `orderId`, `posSystem`, `createdAt`, `closedAt`, `diningOption`, `subtotal`, `taxAmount`, `tipAmount`, `totalAmount`, `lineItems[]` (with modifiers and discounts), and `payments[]`. Every amount stored in cents with currency code.

### 2.3 Webhook-First Integration

| POS | Primary Method | Latency | Auth |
|-----|---------------|---------|------|
| Toast | Webhook (`order_updated`) | <5 sec | OAuth 2.0 client-credentials |
| Square | Webhook (`order.updated`) | <60 sec | OAuth 2.0 auth-code |
| Clover | Webhook + REST polling | <30 sec | OAuth 2.0 app-based |
| Lightspeed | REST polling (limited webhooks) | 1–5 min | OAuth 2.0 auth-code |
| NCR Aloha | Omnivore middleware or BSL API | 5 min – daily | Partner API key |

Toast's `order_updated` webhook fires on every order create/update with full order JSON (up to 600KB). Square provides `order.created`, `order.updated`, and `payment.updated` events with HMAC-SHA256 signature verification. Clover fires on `CREATE`, `UPDATE`, and `DELETE` events. Revel offers `order.finalized` with HMAC-SHA1 signatures.

### 2.4 Fallback: Receipt Printer Interception

For unsupported POS systems, ESC/POS receipt printer interception serves as the universal fallback. Network printers on TCP port 9100 can be intercepted via a transparent proxy that captures the binary stream while forwarding to the actual printer. Libraries: Python `python-escpos`, .NET `ESCPOS_NET`.

**Critical caveat:** many modern POS systems render text as bitmap graphics before printing — requires OCR rather than direct parsing.

### 2.5 Edge-Deployed POS (Legacy)

For edge-deployed POS systems like NCR Aloha or Oracle Micros, direct database access provides a reliable fallback. Aloha stores data in local SQL on the BOH server; Micros Simphony uses SQL Server or Oracle. A local agent polls for new records using timestamp columns and buffers transactions locally when the network is unavailable.

### 2.6 Implementation Priority

| Phase | POS Systems | Coverage |
|-------|------------|----------|
| 1 | Toast + Square | ~52% |
| 2 | Clover + Revel | ~63% |
| 3 | Lightspeed + Aloha (via middleware) | ~73% |
| 4 | ESC/POS printer interception (universal fallback) | ~100% |

---

## 3. Go-Based Agent — Two-Process Architecture

### 3.1 Overview

The edge agent runs as a **modular monolith in Go** communicating with a **Python AI inference service** via gRPC. Go delivers single-binary deployment with zero runtime dependencies (~15MB binary). Python provides the ML ecosystem for blob detection inference.

> See `docs/03-architecture/system-design.md#layer-descriptions` for the conceptual 6-layer architecture this implements.

### 3.2 Two-Process Model

Separates a headless background service from a lightweight tray application — the pattern used by Plex, TeamViewer, and Docker Desktop.

| Component | Role | Runs As |
|-----------|------|---------|
| **Service** | Core logic: camera orchestration, POS integration, AI orchestration, device communication, embedded web server | Windows Service / macOS LaunchDaemon / Linux systemd unit |
| **Tray app** | Status display, dashboard launch, start/stop controls | User-session GUI via `fyne.io/systray` |

Communication between tray app and service: localhost HTTP.

### 3.3 Framework Comparison

| Framework | Binary Size | RAM Usage | Recommendation |
|-----------|------------|-----------|----------------|
| **Go + fyne.io/systray** | 5–15 MB | 5–15 MB | Recommended for always-on tray agent |
| **Tauri** (Rust + OS WebView) | 3–10 MB | 20–40 MB | Alternative if rich web dashboard needed |
| Electron | 50–120 MB | 150–240 MB | **Avoid** — too heavy for restaurant shared PCs |

### 3.4 Auto-Start Configuration

| Platform | Method |
|----------|--------|
| Windows | `HKCU\...\Run` registry key or Task Scheduler for pre-login start |
| macOS | LaunchAgent plist with `RunAtLoad=true` and `KeepAlive=true` |
| Linux | systemd unit with `WantedBy=multi-user.target` and `Restart=always` |

### 3.5 Embedded Web Dashboard

Served at `localhost:PORT` using Go's `gin` or `echo` framework with a React SPA embedded via Go 1.16+ `embed` package. Staff access through tray menu "Open Dashboard". Connects to the agent's WebSocket endpoint for live updates and REST API for data queries.

### 3.6 Resource Budget

| Resource | Target |
|----------|--------|
| CPU | 1–2 cores |
| RAM | 500 MB – 1 GB (complete agent + inference) |
| Disk | ~50 MB (agent) + models |

Key optimizations:
- ONNX Runtime: cap `intra_op_num_threads=1` (reduces idle CPU from 47% to 0.5%)
- Service runs at below-normal priority (`BELOW_NORMAL_PRIORITY_CLASS` on Windows)
- AI models load lazily on demand, unload when idle

### 3.7 Auto-Update

Custom updater inspired by Tauri's approach:
1. Check static JSON endpoint on CDN for new versions
2. Download update with Ed25519 signature verification
3. Stop service gracefully
4. Replace binaries
5. Restart and run health check
6. Roll back automatically on failure

Delta updates minimize bandwidth. Staged rollouts use percentage-based logic server-side.

---

## 4. Staff Device Discovery and Communication

### 4.1 mDNS Service Discovery

The edge agent advertises itself using **mDNS** with service type `_sangati._tcp.local.` — the same zero-config protocol powering Chromecast, Sonos, and AirPlay.

| Platform | API |
|----------|-----|
| Android | NsdManager (API 16+) |
| iOS | NWBrowser with service type in `Info.plist` under `NSBonjourServices` |

### 4.2 QR Code Pairing (Fallback)

When mDNS is blocked by network configuration, the agent's dashboard displays a QR code containing:

```json
{
  "ip": "192.168.1.50",
  "port": 8080,
  "wsPort": 8081,
  "authToken": "<one-time-token>",
  "tlsFingerprint": "<cert-sha256>"
}
```

Most reliable onboarding method for non-technical restaurant staff.

### 4.3 Real-Time Communication: MQTT + WebSocket

An embedded **Eclipse Mosquitto** broker (<10 MB RAM) runs as a sidecar, providing topic-based pub/sub with QoS guarantees.

**Topic structure:**
```
restaurant/{id}/orders/new
restaurant/{id}/tables/{tableId}/status
restaurant/{id}/kitchen/alerts
restaurant/{id}/staff/{staffId}/alerts
```

Kitchen displays subscribe to order topics. Floor servers subscribe to their assigned tables. Managers subscribe to all topics.

MQTT supports WebSocket transport natively (port 9001), enabling **browser-based PWA clients** to subscribe directly. This bridges web tablets with native mobile apps on the same event bus.

| Client Type | Transport | Deployment |
|-------------|-----------|-----------|
| Staff phones (native) | MQTT over TCP | App store |
| Tablets (PWA) | MQTT over WebSocket | Served from agent, zero app store |
| Smartwatches | Native companion app (WatchOS/Wear OS) | App store |

### 4.4 Offline-First Sync

SQLite on each device with **cr-sqlite** (CRDT extension) for automatic conflict-free sync. Each row gets per-column versioning with Lamport clocks and site IDs.

When a floor server takes an order on a tablet without WiFi:
1. Queues locally in SQLite
2. On reconnect, cr-sqlite ships only missing operations to the agent
3. Merges without conflicts

**Priority sync:** Order creation and payments sync immediately (aggressive retry). Analytics data syncs lazily.

### 4.5 Remote Access

| Method | Use Case | Architecture |
|--------|----------|-------------|
| **Cloudflare Tunnel** | Manager access from home | Outbound-only encrypted connection — no inbound ports |
| **Tailscale** (WireGuard mesh VPN) | IT administration | Peer-to-peer with NAT traversal |
| **Cloud relay → APNS/FCM** | Smartwatch push alerts | Watches cannot maintain persistent local connections |

### 4.6 Local TLS

The agent generates a local CA using `mkcert` on first boot and creates certificates for its IP and `.local` hostname. During device enrollment (QR code scan), the CA root certificate is distributed to staff devices. Provides HTTPS/WSS without browser warnings on the LAN.

---

## 5. One-Click Deployment

### 5.1 Installer Sequence

Mirrors Plex Media Server's proven approach: download a single executable, run it, everything else is automatic.

| Step | Action |
|------|--------|
| 1 | Copy files to Program Files |
| 2 | Register Windows Service via `sc create` |
| 3 | Add firewall exceptions (`netsh advfirewall firewall add rule`) |
| 4 | Set auto-start via Registry Run key |
| 5 | Launch tray app |
| 6 | Prompt for license activation |

**Installer tooling:** NSIS (Windows), PKG (macOS). Silent installation (`/S` flag) supports managed IT deployments across restaurant chains. Target installer size: **10–15 MB** (Go + systray).

### 5.2 License Activation

Hardware-fingerprinted subscription model:
1. Agent generates fingerprint: SHA-256 hash of machine GUID + MAC addresses + CPU serial + disk serial
2. User enters subscription key
3. Agent sends `{key, fingerprint}` to activation server
4. Server returns Ed25519-signed activation block
5. Block cached locally for offline verification

**Phone-home interval:** every 24 hours. **Offline grace period:** 14 days (verified via signed activation block's embedded expiry date).

### 5.3 Network Configuration

Fully automated:
- Inbound firewall rules created during installation for HTTP, WebSocket, and mDNS ports
- All cloud communication uses outbound-only connections (HTTPS 443) — no router port forwarding needed
- Agent advertises via mDNS for local device discovery without manual network config
- For restrictive corporate firewalls: outbound-only WebSocket tunnel pattern (identical to TeamViewer's architecture)

---

## 6. Production Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Agent core | **Go 1.22+** | Single binary, goroutines for concurrency, 50 MB footprint |
| AI service | **Python 3.11+ with ONNX Runtime** | Richest ML ecosystem, cross-platform inference |
| Video decode | **FFmpeg with hardware acceleration** | Intel QuickSync reduces CPU 70% per stream |
| AI inference | **TensorRT** (NVIDIA) or **OpenVINO** (Intel) | 2–5× faster than generic ONNX on respective hardware |
| Transactional DB | **SQLite 3.45+ (WAL mode)** | Zero-config, ACID, battle-tested |
| Analytics DB | **DuckDB 1.0+** | 10–50× faster than SQLite for aggregations |
| Message broker | **Eclipse Mosquitto 2.0+** | <10 MB RAM, MQTT + WebSocket transport |
| Camera discovery | **ONVIF + mDNS + SSDP + ARP** | Maximum device coverage through parallel protocols |
| Device communication | **WebSocket + MQTT-over-WebSocket** | Bidirectional real-time with pub/sub routing |
| Remote access | **Cloudflare Tunnel** | Outbound-only, no open ports, free tier |
| Containerization | **Docker Compose** (single site) | Simple, proven in retail edge at scale |

### 6.1 Hardware Recommendations

| Tier | Hardware | Cameras | AI Capability | Cost (est.) |
|------|----------|---------|--------------|-------------|
| Basic | Intel NUC, Core Ultra 7, 16 GB RAM | 4 cameras | Basic blob detection | ~$700 |
| Full | NVIDIA Jetson Orin NX 16 GB | 8–12 cameras | Full analytics | ~$900 |

**Always use sub-streams at 1–5 FPS** for AI inference. Decode via hardware (Intel QuickSync or NVIDIA NVDEC) to free CPU.

### 6.2 Graceful Degradation

| Constraint | Adaptation |
|-----------|-----------|
| No GPU | 2 cameras at 1 FPS, CPU-only inference via OpenVINO |
| RAM < 8 GB | Disable DuckDB analytics, reduce video buffers |
| Storage limited | Compress retention to 24 hours, events-only mode |

The agent detects available resources at startup and automatically configures its operational profile.

---

## 7. Design Principles

Every architectural decision optimizes for the same goal: **a restaurant manager downloads the installer, runs it, and the system works.**

| Principle | Implementation |
|-----------|---------------|
| Zero-configuration reliability > feature depth | ONVIF covers 80% of cameras; brand-specific patterns cover the rest |
| Webhook-first POS | Toast + Square cover ~52% through documented APIs; ESC/POS is universal fallback |
| Smallest deployment footprint | Go + Python hybrid: ~65 MB total |
| No IT intervention for staff onboarding | mDNS discovery + QR code fallback |
| Works behind any firewall | Outbound-only networking (Cloudflare Tunnel, WebSocket tunnels) |

---

## DECISIONS NEEDED

1. **Go vs. Rust for agent core?** Go is recommended for faster development and smaller binary. Rust offers better memory safety guarantees but steeper learning curve. Decision impacts hiring and velocity.
2. **Mosquitto vs. embedded Go MQTT broker (e.g., mochi-mqtt)?** Mosquitto is battle-tested but adds a sidecar process. An embedded broker simplifies deployment to true single-binary.
3. **POS Phase 1 target:** Toast + Square (US-focused) or skip directly to ESC/POS interception (universal, India-relevant)?
4. **Jetson Orin vs. Intel NUC as reference hardware?** Jetson has 10× more AI throughput but requires NVIDIA ecosystem. Intel NUC is more commonly available in Indian markets (ASSUMPTION).
5. **cr-sqlite vs. simpler last-write-wins sync?** CRDT sync is elegant but adds complexity. For MVP, timestamp-based sync may be sufficient since concurrent writes are rare.
6. **License model:** Per-device subscription vs. per-restaurant flat fee? Impacts activation architecture.
7. **Installer framework:** NSIS (proven, Windows-only) vs. WiX (more flexible, steeper learning curve) vs. Tauri bundler (cross-platform)?
