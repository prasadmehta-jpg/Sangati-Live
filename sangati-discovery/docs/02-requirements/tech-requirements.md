# Technical Requirements — Sangati AI

> **Version:** Discovery v0.1 | **Date:** 2026-02-13 | **Status:** Draft
> **Local RAG sources:** None. Hardware and infra specs based on industry standards (ASSUMPTION).

---

## 1. Edge Device

### 1.1 Hardware Options (ASSUMPTION: evaluated, not selected)

| Option | CPU/GPU | RAM | Storage | Power | Price (approx) | Pros | Cons |
|---|---|---|---|---|---|---|---|
| **NVIDIA Jetson Orin Nano** | 6-core ARM + 1024 CUDA cores | 8 GB | 128 GB NVMe | 15W | $250 USD | Best inference perf/watt, CUDA ecosystem | Availability in India, thermal management |
| **Intel NUC 13 + OpenVINO** | i5-1340P | 16 GB | 256 GB SSD | 65W | $400 USD | x86 ecosystem, OpenVINO optimized | Higher power, cost, overkill for blob detection |
| **Raspberry Pi 5 + Coral TPU** | BCM2712 + Edge TPU | 8 GB | 128 GB SD | 12W | $150 USD | Cheapest, lowest power | Limited sustained inference, SD card reliability |

**Recommendation (ASSUMPTION):** Jetson Orin Nano for pilot. Best balance of performance, power, and ecosystem for CV workloads.

### 1.2 Hardware Requirements (Minimum)

| Spec | Minimum | Recommended |
|---|---|---|
| CPU | 4-core ARM Cortex-A78 or equivalent | 6-core |
| GPU / NPU | Dedicated inference accelerator | NVIDIA CUDA or Coral TPU |
| RAM | 4 GB | 8 GB |
| Storage | 64 GB | 128 GB (30-day log retention) |
| Network | Gigabit Ethernet + WiFi 5 | Gigabit Ethernet + WiFi 6 |
| Power | 12V DC, <20W | UPS-backed (critical for service hours) |
| Form factor | Fanless or quiet fan | Fanless (restaurant ambient noise concern) |
| Operating temp | 0–45°C | Server room or ventilated closet |

### 1.3 Edge Software Stack

| Layer | Technology | Notes |
|---|---|---|
| OS | Ubuntu 22.04 LTS (ARM) or JetPack 6 | Long-term support, stable |
| Container runtime | Docker + Docker Compose | Service isolation, easy updates |
| Vision inference | ONNX Runtime or TensorRT | Model-agnostic, hardware-optimized |
| Application runtime | Node.js 20 LTS or Python 3.11 | Rules engine in TypeScript; vision pipeline in Python |
| Database | SQLite 3 (WAL mode) | Single-writer, multi-reader. No server process. |
| Message bus (local) | MQTT (Mosquitto) | Lightweight pub/sub for vision→rules→router pipeline |
| Alert delivery | WebSocket server (local) | Staff app connects via LAN WebSocket |
| Process manager | systemd | Auto-restart on crash |
| Monitoring | Watchdog + heartbeat to local log | Self-healing: restart service if unresponsive for 30s |

---

## 2. CCTV / Camera Requirements

### 2.1 Minimum Camera Specs

| Spec | Minimum | Notes |
|---|---|---|
| Resolution | 720p (1280x720) | 1080p preferred for larger zones |
| Frame rate | 10 fps | Higher fps unnecessary for blob detection |
| Field of view | ≥90° horizontal | Must cover assigned zone fully |
| Night mode / IR | Required | Restaurant lighting varies; evening service may be dim |
| Network output | RTSP over Ethernet | Standard on all IP cameras and most NVRs |
| Mounting | Ceiling, 2.5–4m height | Overhead or angled view preferred for zone coverage |

### 2.2 CCTV Access Modes (Priority Order)

1. **RTSP from NVR/DVR** (preferred): Most Indian restaurants use Hikvision/CP Plus NVRs with RTSP output. URL format: `rtsp://<user>:<pass>@<ip>:554/Streaming/Channels/<n>01`
2. **Direct IP camera RTSP**: If cameras are IP-based without NVR, connect directly.
3. **HDMI capture card**: For legacy analog systems — HDMI out from DVR → USB capture card → edge device. Adds $30–50 per camera.
4. **USB camera (direct)**: Fallback for restaurants with no existing CCTV. USB webcam mounted in zone. Cheapest but lowest quality.

### 2.3 Camera Layout (ASSUMPTION: typical 60-seat restaurant)

| Camera | Position | Covers | Zone Count |
|---|---|---|---|
| CAM-1 | Dining hall ceiling (center) | Main dining zone | 3–4 table zones |
| CAM-2 | Dining hall ceiling (corner) | Supplementary angle | Overlaps CAM-1 zones |
| CAM-3 | Entry / host stand | Entry zone, waiting area | 1 zone |
| CAM-4 | Kitchen pass (if available) | Pass / pickup area | 1 zone (Phase 2) |

---

## 3. Network Infrastructure

### 3.1 LAN Requirements

| Component | Spec | Notes |
|---|---|---|
| Router/switch | Gigabit, ≥8 ports | Dedicated or shared with restaurant network |
| WiFi AP | WiFi 5+ (802.11ac), 2.4 + 5 GHz | Staff phones connect via WiFi |
| SSID | Dedicated "Sangati-Staff" network (ASSUMPTION) | Isolates from guest WiFi for reliability |
| IP scheme | Static IPs for edge device + cameras; DHCP for phones | Predictable addressing |
| Internet | Optional. 10 Mbps+ for cloud sync | Not required during service |

### 3.2 Network Architecture

```
[CCTV Cameras] --RTSP--> [Edge Device]
                              |
                    [MQTT internal bus]
                              |
                    [WebSocket server]
                              |
                   [Staff Phones via WiFi]
                              |
               [Cloud Sync via Internet (batch, off-peak)]
```

---

## 4. Staff Device Requirements

### 4.1 Phone Specs (Minimum)

| Spec | Minimum |
|---|---|
| OS | Android 10 (API 29) |
| RAM | 2 GB |
| Storage | 100 MB free for app |
| Network | WiFi (no mobile data required) |
| Screen | 5"+ |
| Battery | App must consume <5% per 8-hour shift |

### 4.2 App Technology (ASSUMPTION)

| Option | Pros | Cons |
|---|---|---|
| **Flutter (cross-platform)** | Single codebase, fast UI, good Android perf | Larger APK, requires Flutter expertise |
| **React Native** | Web developer friendly, large ecosystem | Bridge overhead, potential perf issues on budget phones |
| **Native Android (Kotlin)** | Best performance, smallest APK, native push | Android-only (fine for India MVP), requires Android expertise |
| **PWA** | Zero install, works in browser | No reliable background push on Android, limited offline |

**Recommendation (ASSUMPTION):** Native Android (Kotlin) for MVP — smallest footprint, best battery efficiency, reliable push on budget phones. Flutter for Phase 2 if iOS is needed.

---

## 5. Cloud Infrastructure (Analytics Only)

### 5.1 Purpose
Cloud is NOT in the critical path. Used only for:
- Storing aggregate analytics for owner dashboard
- Firmware/rule update distribution
- Multi-outlet comparison (Phase 2)

### 5.2 Stack (ASSUMPTION)

| Component | Technology | Notes |
|---|---|---|
| Hosting | AWS Mumbai (ap-south-1) or DigitalOcean BLR | Low latency to India |
| API | Node.js or Python FastAPI | Receives batch uploads from edge |
| Database | PostgreSQL | Structured analytics data |
| Object storage | S3 / Spaces | Firmware images, rule bundles |
| Auth | API key per edge device (MVP) | JWT for staff/owner apps |
| Dashboard | Next.js or Grafana | Owner-facing analytics web UI |

### 5.3 Data Volume Estimate (ASSUMPTION)

| Data Type | Volume per Day | 30-Day Retention |
|---|---|---|
| State-transition events | ~5,000 events × 200 bytes = 1 MB | 30 MB |
| Alert logs | ~200 alerts × 500 bytes = 100 KB | 3 MB |
| Daily summaries | ~1 KB | 30 KB |
| **Total per restaurant** | **~1.1 MB/day** | **~33 MB/month** |

Cloud storage cost: negligible (<$1/month per restaurant).

---

## 6. Security Requirements

| Requirement | Implementation |
|---|---|
| Edge device access | SSH key-only. No password auth. Firewall: only LAN + RTSP inbound. |
| Staff app auth | PIN or biometric unlock on phone. App session token (no password). |
| Manager/owner auth | PIN + role-based permissions in app. |
| Data in transit (LAN) | WebSocket over LAN. TLS optional for MVP (trusted network — ASSUMPTION). |
| Data in transit (cloud) | HTTPS/TLS 1.3 mandatory. |
| Data at rest (edge) | SQLite on encrypted partition (LUKS — ASSUMPTION). |
| Camera credentials | Stored encrypted on edge device. Never transmitted to cloud. |
| Firmware updates | Signed packages. Verified before install. |
| Privacy | No PII stored. No biometrics. No raw video. Event logs only. |

---

## 7. Deployment Requirements

| Requirement | Spec |
|---|---|
| Install time (hardware) | ≤4 hours (mount device, connect cameras, configure network) |
| Install time (software) | ≤1 hour (pre-imaged SD/NVMe, zone configuration) |
| Zone configuration | Visual tool: overlay zones on camera snapshot. Drag-to-define. |
| Staff onboarding | ≤10 min per person (install app, enter name, select role/zone) |
| Maintenance | Remote SSH for diagnostics. Field visit for hardware issues. |
| Update mechanism | OTA via LAN (field-ops laptop) or cloud push (when internet available) |

---

## DECISIONS NEEDED

1. **Edge hardware:** Jetson Orin Nano vs. Intel NUC vs. RPi 5 + Coral. Needs hands-on testing with actual restaurant CCTV feed.
2. **App technology:** Native Android vs. Flutter vs. React Native. Depends on team skills and Phase 2 iOS plans.
3. **Cloud provider:** AWS Mumbai vs. DigitalOcean BLR vs. self-hosted. Cost and compliance considerations.
4. **TLS on LAN:** Enforce TLS for WebSocket on trusted restaurant LAN? Adds complexity but improves security posture.
5. **Zone configuration tool:** Who builds it? Separate tool or integrated into manager app? Must be ready before pilot.
6. **UPS for edge device:** Mandate UPS or accept downtime during power cuts? (Power reliability varies in India.)
