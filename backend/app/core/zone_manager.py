"""
Zone Manager - Manages restaurant tables, areas, and sections.
Tracks real-time state of every zone in the restaurant.
"""

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.zone import Zone
from typing import Optional


DEFAULT_ZONES = [
    {"name": "Table 1", "zone_type": "dining", "capacity": 4, "position_x": 1.0, "position_y": 1.0},
    {"name": "Table 2", "zone_type": "dining", "capacity": 4, "position_x": 2.0, "position_y": 1.0},
    {"name": "Table 3", "zone_type": "dining", "capacity": 2, "position_x": 3.0, "position_y": 1.0},
    {"name": "Table 4", "zone_type": "dining", "capacity": 6, "position_x": 1.0, "position_y": 2.0},
    {"name": "Table 5", "zone_type": "dining", "capacity": 4, "position_x": 2.0, "position_y": 2.0},
    {"name": "Table 6", "zone_type": "dining", "capacity": 8, "position_x": 3.0, "position_y": 2.0},
    {"name": "Bar Section", "zone_type": "bar", "capacity": 10, "position_x": 4.0, "position_y": 1.5},
    {"name": "Patio A", "zone_type": "patio", "capacity": 6, "position_x": 1.0, "position_y": 3.0},
    {"name": "Patio B", "zone_type": "patio", "capacity": 4, "position_x": 2.0, "position_y": 3.0},
    {"name": "Entrance/Wait Area", "zone_type": "entrance", "capacity": 15, "position_x": 0.0, "position_y": 0.0},
    {"name": "Kitchen", "zone_type": "kitchen", "capacity": 0, "position_x": 5.0, "position_y": 1.5},
    {"name": "Private Dining", "zone_type": "dining", "capacity": 12, "position_x": 4.0, "position_y": 3.0},
]


async def seed_zones(db: AsyncSession) -> list[Zone]:
    """Create default zones if none exist."""
    result = await db.execute(select(Zone))
    existing = result.scalars().all()
    if existing:
        return list(existing)

    zones = []
    for z in DEFAULT_ZONES:
        zone = Zone(**z)
        db.add(zone)
        zones.append(zone)
    await db.commit()
    for zone in zones:
        await db.refresh(zone)
    return zones


async def get_all_zones(db: AsyncSession) -> list[Zone]:
    result = await db.execute(select(Zone).where(Zone.is_active == True).order_by(Zone.id))
    return list(result.scalars().all())


async def get_zone(db: AsyncSession, zone_id: int) -> Optional[Zone]:
    result = await db.execute(select(Zone).where(Zone.id == zone_id))
    return result.scalar_one_or_none()


async def update_zone_occupancy(db: AsyncSession, zone_id: int, occupancy: int) -> Optional[Zone]:
    zone = await get_zone(db, zone_id)
    if not zone:
        return None
    zone.current_occupancy = max(0, min(occupancy, zone.capacity))
    if zone.current_occupancy == 0:
        zone.status = "available"
    elif zone.current_occupancy >= zone.capacity:
        zone.status = "occupied"
    else:
        zone.status = "occupied"
    zone.sync_version += 1
    await db.commit()
    await db.refresh(zone)
    return zone


async def update_zone_status(db: AsyncSession, zone_id: int, status: str) -> Optional[Zone]:
    zone = await get_zone(db, zone_id)
    if not zone:
        return None
    zone.status = status
    zone.sync_version += 1
    await db.commit()
    await db.refresh(zone)
    return zone


async def get_zone_pressure_summary(db: AsyncSession) -> dict:
    """Calculate overall restaurant pressure metrics."""
    zones = await get_all_zones(db)
    total_capacity = sum(z.capacity for z in zones if z.zone_type != "kitchen")
    total_occupancy = sum(z.current_occupancy for z in zones if z.zone_type != "kitchen")
    occupied_tables = sum(1 for z in zones if z.zone_type == "dining" and z.current_occupancy > 0)
    total_tables = sum(1 for z in zones if z.zone_type == "dining")

    occupancy_rate = total_occupancy / total_capacity if total_capacity > 0 else 0
    table_utilization = occupied_tables / total_tables if total_tables > 0 else 0

    return {
        "total_zones": len(zones),
        "total_capacity": total_capacity,
        "total_occupancy": total_occupancy,
        "occupancy_rate": round(occupancy_rate, 2),
        "occupied_tables": occupied_tables,
        "total_tables": total_tables,
        "table_utilization": round(table_utilization, 2),
        "zones_by_status": {
            "available": sum(1 for z in zones if z.status == "available"),
            "occupied": sum(1 for z in zones if z.status == "occupied"),
            "reserved": sum(1 for z in zones if z.status == "reserved"),
            "cleaning": sum(1 for z in zones if z.status == "cleaning"),
        },
    }
