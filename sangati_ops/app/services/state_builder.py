from typing import Any
from app.services.posbridge_client import POSBridgeClient
from app.core.logging import now_ms

async def build_state(venue_id: str) -> dict[str, Any]:
    pos = POSBridgeClient()
    snap = await pos.get_snapshot(venue_id=venue_id)
    # normalize/minify state for agents (keep small but useful)
    return {
        "venue_id": venue_id,
        "ts_ms": now_ms(),
        "pos_snapshot": snap,
    }
