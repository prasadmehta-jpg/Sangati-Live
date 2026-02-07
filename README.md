# Intuiserve Sangati

Offline-first, on-prem capable anticipatory operations intelligence system for restaurants.

Sangati watches your restaurant floor in real time, detects pressure building (tables filling up, guests waiting, service slowing), makes rule-based decisions, and sends plain-English nudges to your staff before problems happen.

## What It Does

- **Zone Manager** - Tracks every table, bar section, patio, and entrance area in your restaurant
- **Signal Engine** - Detects pressure signals: high occupancy, long waits, guests arriving, tables turning over
- **Decision Engine** - Applies deterministic rules to signals (not fake ML - real logic that's ML-ready for the future)
- **Nudge Generator** - Creates human-readable action items: "Greet guests at Table 4" or "Table 6 needs clearing, guests waiting"
- **Audit Log** - Records every action with full traceability. Click "Why am I seeing this?" on any nudge
- **Demo Simulator** - Generates realistic restaurant scenarios (quiet afternoon, dinner rush, wind-down) without touching real data

## Quick Look

The dashboard shows:
- Live floor status with occupancy bars for every zone
- Active nudges with priority levels (urgent/high/normal/low)
- "Why am I seeing this?" explanation on every nudge
- Signal feed showing real-time pressure detection
- Decision log showing what rules fired and why
- Full audit trail of every system action

---

## How Prasad Runs This On His Laptop

### Option A: Docker (Recommended - One Command)

You need Docker installed. That's it.

```bash
# 1. Clone the repo
git clone https://github.com/prasadmehta-jpg/Sangati-Live.git
cd Sangati-Live

# 2. Start it
docker-compose up --build

# 3. Open your browser
# Go to http://localhost:8000
```

Done. The system starts in Demo Mode with simulated restaurant data.

### Option B: Without Docker

You need Python 3.11+ and Node.js 18+.

```bash
# 1. Clone the repo
git clone https://github.com/prasadmehta-jpg/Sangati-Live.git
cd Sangati-Live

# 2. Copy environment file
cp .env.example .env

# 3. Set up backend
cd backend
python3 -m venv .venv
source .venv/bin/activate      # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 4. Start backend
python run.py &

# 5. Set up frontend (new terminal)
cd frontend
npm install
npm run dev

# 6. Open your browser
# Go to http://localhost:5173
```

Or use the helper script:
```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

### What You'll See

1. The dashboard opens in Demo Mode (toggle in top-right corner)
2. The simulator generates restaurant activity every 5 seconds
3. Zones fill up, signals fire, decisions get made, nudges appear
4. Click scenario buttons (quiet / steady / rush / wind down) to change intensity
5. Click "Why am I seeing this?" on any nudge to see the full explanation
6. Click "Tick" to manually advance the simulation
7. Click "Reset" to clear all simulation data and start fresh
8. Toggle Demo Mode off to switch to real sensor input mode

---

## How Prasad Deploys This To Cloud Later

### Option 1: Any VPS (DigitalOcean, Linode, AWS EC2, etc.)

```bash
# SSH into your server
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and run
git clone https://github.com/prasadmehta-jpg/Sangati-Live.git
cd Sangati-Live
docker-compose up -d --build

# Your app is now live at http://your-server-ip:8000
```

To put it behind a domain name, add nginx:

```bash
apt install nginx -y
```

Create `/etc/nginx/sites-available/sangati`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/sangati /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

For HTTPS, add Let's Encrypt:
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com
```

### Option 2: Railway / Render / Fly.io (One-Click Cloud)

These platforms auto-detect the Dockerfile:

1. Push your code to GitHub
2. Connect the repo to Railway/Render/Fly.io
3. It builds and deploys automatically
4. You get a public URL

### Option 3: Edge Deployment (On-Prem at the Restaurant)

For running directly at the restaurant without internet:

1. Get any small computer (Intel NUC, Raspberry Pi 4+, old laptop)
2. Install Docker
3. Clone the repo and run `docker-compose up -d`
4. Connect restaurant devices to the same network
5. Access via `http://<device-ip>:8000` from any browser on the network

The system runs entirely offline. No external APIs, no cloud dependency.

---

## Project Structure

```
Sangati-Live/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes.py          # All REST API endpoints
│   │   │   └── schemas.py         # Request/response models
│   │   ├── core/
│   │   │   ├── zone_manager.py    # Zone/table management
│   │   │   ├── signal_engine.py   # Pressure signal detection
│   │   │   ├── decision_engine.py # Rule-based decisions
│   │   │   ├── nudge_generator.py # Human-readable actions
│   │   │   └── audit_service.py   # Full audit trail
│   │   ├── demo/
│   │   │   └── simulator.py       # Demo data generator
│   │   ├── models/
│   │   │   ├── zone.py            # Zone database model
│   │   │   ├── signal.py          # Signal database model
│   │   │   ├── decision.py        # Decision database model
│   │   │   ├── nudge.py           # Nudge database model
│   │   │   └── audit.py           # Audit log model
│   │   ├── services/
│   │   │   └── pipeline.py        # Orchestrates signal->decision->nudge
│   │   ├── config.py              # Configuration from env vars
│   │   ├── database.py            # SQLite async setup
│   │   └── main.py                # FastAPI application entry
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx         # Top bar with demo controls
│   │   │   ├── ZoneCard.jsx       # Zone status card
│   │   │   └── NudgeCard.jsx      # Nudge with "Why?" explanation
│   │   ├── hooks/
│   │   │   └── useDashboard.js    # Auto-polling dashboard hook
│   │   ├── pages/
│   │   │   ├── LiveOpsView.jsx    # Main operations dashboard
│   │   │   ├── ZonesView.jsx      # Zone management view
│   │   │   ├── NudgesView.jsx     # Nudge management view
│   │   │   ├── SignalsView.jsx    # Signal feed view
│   │   │   ├── DecisionsView.jsx  # Decision engine view
│   │   │   └── AuditView.jsx      # Audit trail view
│   │   ├── services/
│   │   │   └── api.js             # API client
│   │   ├── styles/
│   │   │   └── global.css         # Dark theme styling
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── scripts/
│   ├── start-dev.sh               # Dev mode launcher
│   └── start-prod.sh              # Production launcher
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .gitignore
└── README.md
```

## API Endpoints

All under `/api`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Full dashboard state (zones + nudges + signals + decisions) |
| GET | `/zones` | All zones |
| GET | `/zones/{id}` | Single zone |
| PATCH | `/zones/{id}` | Update zone occupancy/status |
| GET | `/signals` | Recent signals (query: minutes, zone_id) |
| GET | `/signals/active` | Non-expired signals |
| GET | `/decisions` | Recent decisions |
| GET | `/decisions/pending` | Pending decisions |
| GET | `/nudges` | Active nudges (query: role) |
| POST | `/nudges/{id}/action` | Acknowledge or dismiss nudge |
| GET | `/audit` | Audit log (query: limit, event_type) |
| GET | `/audit/trace/{nudge_id}` | Full trace for a nudge |
| GET | `/demo/status` | Demo mode status |
| POST | `/demo/scenario` | Change simulation scenario |
| POST | `/demo/toggle` | Enable/disable demo mode |
| POST | `/demo/reset` | Reset simulation |
| POST | `/demo/tick` | Manual pipeline tick |
| GET | `/health` | Health check |

Interactive API docs available at `http://localhost:8000/docs` when running.

## Technical Notes

- **Database**: SQLite with async driver. Every record has `sync_version` and `is_synced` columns for future multi-site sync.
- **AI Logic**: The decision engine uses explicit, deterministic rules. No fake ML. Each rule has clear trigger conditions, confidence scoring, and human-readable explanations. The interface is designed so rules can be replaced by trained models later without changing the API.
- **No Biometric Data**: The system tracks zone occupancy counts, not individual people.
- **Offline-First**: Zero external API calls. Everything runs locally. The only network requirement is browser-to-server on the same network.
- **Demo Safety**: All simulated data is tagged `is_demo=True` and never mixed with real operational data.
