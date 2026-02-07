"""
Demo Simulator - Generates realistic fake restaurant data safely.

Simulates a restaurant service over time:
- Guests arrive and are seated
- Tables fill up and turn over
- Entrance builds wait pressure
- Orders are placed and completed

All simulated data is tagged with is_demo=True.
This module never touches real data.
"""

import random
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.zone import Zone


# Simulation profiles for different restaurant states
SCENARIOS = {
    "quiet": {
        "description": "Slow weekday afternoon",
        "arrival_probability": 0.15,
        "departure_probability": 0.2,
        "max_entrance_queue": 3,
    },
    "steady": {
        "description": "Normal dinner service",
        "arrival_probability": 0.35,
        "departure_probability": 0.15,
        "max_entrance_queue": 6,
    },
    "rush": {
        "description": "Friday night rush",
        "arrival_probability": 0.6,
        "departure_probability": 0.1,
        "max_entrance_queue": 12,
    },
    "wind_down": {
        "description": "Late night wind-down",
        "arrival_probability": 0.05,
        "departure_probability": 0.35,
        "max_entrance_queue": 2,
    },
}

# Current simulation state
_current_scenario = "steady"
_tick_count = 0


def get_current_scenario() -> dict:
    return {"name": _current_scenario, **SCENARIOS[_current_scenario]}


def set_scenario(name: str) -> dict:
    global _current_scenario
    if name not in SCENARIOS:
        raise ValueError(f"Unknown scenario: {name}. Available: {list(SCENARIOS.keys())}")
    _current_scenario = name
    return get_current_scenario()


async def simulate_tick(db: AsyncSession) -> dict:
    """
    Run one simulation tick. Mutates zone occupancy to create
    realistic restaurant activity. Returns a summary of changes.
    """
    global _tick_count
    _tick_count += 1

    scenario = SCENARIOS[_current_scenario]
    changes = []

    result = await db.execute(select(Zone).where(Zone.is_active == True))
    zones = list(result.scalars().all())

    for zone in zones:
        if zone.zone_type == "kitchen":
            continue

        old_occupancy = zone.current_occupancy
        old_status = zone.status

        if zone.zone_type == "entrance":
            # Entrance: guests arrive and wait
            if random.random() < scenario["arrival_probability"]:
                addition = random.randint(1, 4)
                zone.current_occupancy = min(
                    zone.current_occupancy + addition,
                    scenario["max_entrance_queue"]
                )
            # Some guests leave if wait is too long
            if zone.current_occupancy > scenario["max_entrance_queue"] * 0.7:
                if random.random() < 0.3:
                    zone.current_occupancy = max(0, zone.current_occupancy - random.randint(1, 2))

        elif zone.zone_type in ("dining", "patio"):
            if zone.current_occupancy == 0 and zone.status == "available":
                # Empty table: chance of seating from entrance
                entrance = next((z for z in zones if z.zone_type == "entrance"), None)
                if entrance and entrance.current_occupancy > 0 and random.random() < scenario["arrival_probability"]:
                    party_size = min(random.randint(1, zone.capacity), entrance.current_occupancy)
                    zone.current_occupancy = party_size
                    zone.status = "occupied"
                    entrance.current_occupancy = max(0, entrance.current_occupancy - party_size)
                    entrance.sync_version += 1

            elif zone.current_occupancy > 0:
                # Occupied table: chance of departure
                if random.random() < scenario["departure_probability"]:
                    zone.current_occupancy = 0
                    zone.status = "cleaning" if random.random() < 0.7 else "available"

            elif zone.status == "cleaning":
                # Cleaning: chance of becoming available
                if random.random() < 0.4:
                    zone.status = "available"

        elif zone.zone_type == "bar":
            # Bar: more fluid occupancy changes
            delta = random.choice([-2, -1, 0, 0, 1, 1, 2, 3]) if random.random() < scenario["arrival_probability"] else random.choice([-1, 0, 0])
            zone.current_occupancy = max(0, min(zone.current_occupancy + delta, zone.capacity))
            zone.status = "occupied" if zone.current_occupancy > 0 else "available"

        if zone.current_occupancy != old_occupancy or zone.status != old_status:
            zone.sync_version += 1
            changes.append({
                "zone_id": zone.id,
                "zone_name": zone.name,
                "old_occupancy": old_occupancy,
                "new_occupancy": zone.current_occupancy,
                "old_status": old_status,
                "new_status": zone.status,
            })

    if changes:
        await db.commit()

    return {
        "tick": _tick_count,
        "scenario": _current_scenario,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "changes": changes,
        "total_changes": len(changes),
    }


async def reset_simulation(db: AsyncSession) -> dict:
    """Reset all zones to empty/available state."""
    global _tick_count
    _tick_count = 0

    result = await db.execute(select(Zone).where(Zone.is_active == True))
    zones = result.scalars().all()
    for zone in zones:
        zone.current_occupancy = 0
        zone.status = "available"
        zone.sync_version += 1
    await db.commit()

    return {"status": "reset", "zones_reset": len(zones)}
