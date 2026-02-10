"""
Signal Engine - Detects intent and pressure signals from zone state.

Signals represent observable events or inferred conditions:
- Occupancy changes (someone sat down / left)
- Dwell time exceeding thresholds
- Service pressure (many occupied tables, few staff signals)
- Wait time building at entrance
- Order pace anomalies

This engine reads zone state and generates Signal records.
It does NOT use biometric data.
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.signal import Signal
from app.models.zone import Zone
from typing import Optional


# Signal generation rules (deterministic, threshold-based)
SIGNAL_RULES = {
    "high_occupancy": {
        "description": "Zone is at or near capacity",
        "threshold": 0.85,  # occupancy_rate >= 85%
        "signal_type": "wait_time_pressure",
        "base_intensity": 0.7,
    },
    "long_dwell": {
        "description": "Zone has been occupied for extended time without turnover signal",
        "threshold_minutes": 45,
        "signal_type": "dwell_time_high",
        "base_intensity": 0.5,
    },
    "empty_available": {
        "description": "Zone is empty and available during rush",
        "signal_type": "table_turnover",
        "base_intensity": 0.3,
    },
    "entrance_pressure": {
        "description": "Entrance/wait area building up",
        "threshold": 0.5,
        "signal_type": "wait_time_pressure",
        "base_intensity": 0.8,
    },
}


async def evaluate_zone_signals(db: AsyncSession, zone: Zone, is_demo: bool = False) -> list[Signal]:
    """Evaluate a single zone and generate any applicable signals."""
    signals = []

    if zone.zone_type == "kitchen":
        return signals

    occupancy_rate = zone.current_occupancy / zone.capacity if zone.capacity > 0 else 0

    # High occupancy signal
    if occupancy_rate >= SIGNAL_RULES["high_occupancy"]["threshold"]:
        intensity = min(1.0, SIGNAL_RULES["high_occupancy"]["base_intensity"] + (occupancy_rate - 0.85) * 2)
        sig = Signal(
            zone_id=zone.id,
            signal_type="wait_time_pressure",
            intensity=round(intensity, 2),
            source="simulator" if is_demo else "sensor",
            payload={"occupancy_rate": round(occupancy_rate, 2), "rule": "high_occupancy"},
            is_demo=is_demo,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        )
        signals.append(sig)

    # Entrance pressure
    if zone.zone_type == "entrance" and occupancy_rate >= SIGNAL_RULES["entrance_pressure"]["threshold"]:
        intensity = min(1.0, SIGNAL_RULES["entrance_pressure"]["base_intensity"] + occupancy_rate * 0.2)
        sig = Signal(
            zone_id=zone.id,
            signal_type="wait_time_pressure",
            intensity=round(intensity, 2),
            source="simulator" if is_demo else "sensor",
            payload={"waiting_guests": zone.current_occupancy, "rule": "entrance_pressure"},
            is_demo=is_demo,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=3),
        )
        signals.append(sig)

    # Empty table during busy period (only if other zones are full)
    if zone.zone_type == "dining" and zone.current_occupancy == 0 and zone.status == "cleaning":
        sig = Signal(
            zone_id=zone.id,
            signal_type="table_turnover",
            intensity=SIGNAL_RULES["empty_available"]["base_intensity"],
            source="simulator" if is_demo else "sensor",
            payload={"status": zone.status, "rule": "empty_available"},
            is_demo=is_demo,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
        )
        signals.append(sig)

    # Guest arrival signal
    if zone.zone_type == "dining" and zone.current_occupancy > 0 and zone.status == "occupied":
        # Check if we recently generated a signal for this zone
        recent = await db.execute(
            select(Signal)
            .where(Signal.zone_id == zone.id)
            .where(Signal.signal_type == "guest_arrival")
            .where(Signal.created_at > datetime.now(timezone.utc) - timedelta(minutes=2))
        )
        if not recent.scalars().first():
            sig = Signal(
                zone_id=zone.id,
                signal_type="guest_arrival",
                intensity=0.4,
                source="simulator" if is_demo else "sensor",
                payload={"guests": zone.current_occupancy, "rule": "guest_arrival"},
                is_demo=is_demo,
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
            )
            signals.append(sig)

    for sig in signals:
        db.add(sig)

    if signals:
        await db.commit()
        for sig in signals:
            await db.refresh(sig)

    return signals


async def evaluate_all_zones(db: AsyncSession, is_demo: bool = False) -> list[Signal]:
    """Run signal evaluation across all active zones."""
    result = await db.execute(select(Zone).where(Zone.is_active == True))
    zones = result.scalars().all()

    all_signals = []
    for zone in zones:
        zone_signals = await evaluate_zone_signals(db, zone, is_demo=is_demo)
        all_signals.extend(zone_signals)

    return all_signals


async def get_recent_signals(db: AsyncSession, minutes: int = 15, zone_id: Optional[int] = None) -> list[Signal]:
    """Get recent signals, optionally filtered by zone."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    query = select(Signal).where(Signal.created_at > cutoff).order_by(Signal.created_at.desc())
    if zone_id:
        query = query.where(Signal.zone_id == zone_id)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_active_signals(db: AsyncSession) -> list[Signal]:
    """Get all signals that haven't expired yet."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Signal)
        .where((Signal.expires_at == None) | (Signal.expires_at > now))
        .order_by(Signal.created_at.desc())
        .limit(100)
    )
    return list(result.scalars().all())
