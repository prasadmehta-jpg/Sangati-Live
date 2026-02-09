"""
Intuiserve Sangati - Main Application Entry Point

Offline-first anticipatory operations intelligence for restaurants.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pathlib import Path

from app.config import settings
from app.database import init_db, async_session_factory
from app.api.routes import router
from app.core.zone_manager import seed_zones
from app.core.audit_service import log_event
from app.services.ws_manager import ws_manager
from app.services.pipeline import run_expiry_tick

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    await init_db()

    async with async_session_factory() as db:
        await seed_zones(db)
        await log_event(
            db,
            event_type="system_start",
            summary="Sangati system started",
            actor="system",
        )

    # Periodic nudge/signal expiry only - no fake data generation
    scheduler.add_job(
        run_expiry_tick,
        "interval",
        seconds=30,
        id="expiry_tick",
        replace_existing=True,
    )
    scheduler.start()

    yield

    scheduler.shutdown(wait=False)
    async with async_session_factory() as db:
        await log_event(
            db,
            event_type="system_stop",
            summary="Sangati system stopped",
            actor="system",
        )


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Offline-first anticipatory operations intelligence for restaurants",
    lifespan=lifespan,
)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes under /api
app.include_router(router, prefix="/api")


# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# Serve frontend static files - check both dev and Docker locations
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
frontend_dist_docker = Path(__file__).resolve().parent.parent / "frontend_dist"

_dist_dir = None
if frontend_dist.exists():
    _dist_dir = frontend_dist
elif frontend_dist_docker.exists():
    _dist_dir = frontend_dist_docker

if _dist_dir:
    assets_dir = _dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve the React SPA for any non-API route."""
        file_path = _dist_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(_dist_dir / "index.html"))
