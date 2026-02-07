"""
Nudge Generator - Converts decisions into human-readable, actionable nudges.

Nudges are the final output that staff see. Each nudge:
- Targets a specific role (server, host, manager, busser, kitchen)
- Has a plain-English message
- Has a priority level
- Includes a "Why am I seeing this?" explanation
- Has a TTL and can be acknowledged or dismissed
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.decision import Decision
from app.models.nudge import Nudge
from app.config import settings
from typing import Optional


# Maps action_type -> target_role + message template
NUDGE_TEMPLATES = {
    "greeting_prompt": {
        "target_role": "server",
        "priority": "high",
        "template": "Please greet the guests at {zone_name} promptly.",
    },
    "cleanup_dispatch": {
        "target_role": "busser",
        "priority": "high",
        "template": "Table at {zone_name} needs clearing. Guests are waiting to be seated.",
    },
    "pace_adjust": {
        "target_role": "manager",
        "priority": "normal",
        "template": "Monitor service pace at {zone_name} - zone is nearing capacity.",
    },
    "capacity_warning": {
        "target_role": "manager",
        "priority": "urgent",
        "template": "Restaurant approaching capacity. Consider overflow seating or updating wait times.",
    },
    "staff_move": {
        "target_role": "manager",
        "priority": "normal",
        "template": "Consider repositioning staff to cover {zone_name}.",
    },
    "prep_alert": {
        "target_role": "kitchen",
        "priority": "normal",
        "template": "Heads up: expecting increased orders from {zone_name} area.",
    },
    "table_turn": {
        "target_role": "host",
        "priority": "normal",
        "template": "{zone_name} is turning over. Prepare to seat next party.",
    },
}


async def generate_nudges(db: AsyncSession, decisions: list[Decision]) -> list[Nudge]:
    """Convert decisions into nudges."""
    nudges = []

    for decision in decisions:
        template_config = NUDGE_TEMPLATES.get(decision.action_type)
        if not template_config:
            continue

        params = decision.parameters or {}
        zone_name = params.get("zone_name", "Unknown Zone")
        zone_id = params.get("zone_id")

        message = template_config["template"].format(zone_name=zone_name)

        nudge = Nudge(
            decision_id=decision.id,
            zone_id=zone_id,
            target_role=template_config["target_role"],
            message=message,
            priority=template_config["priority"],
            explanation=decision.explanation,
            is_demo=decision.is_demo,
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=settings.NUDGE_TTL_SECONDS),
        )
        db.add(nudge)
        nudges.append(nudge)

        # Update decision status
        decision.status = "nudged"

    if nudges:
        await db.commit()
        for n in nudges:
            await db.refresh(n)

    return nudges


async def get_active_nudges(db: AsyncSession, target_role: Optional[str] = None) -> list[Nudge]:
    """Get all active (non-expired, non-dismissed) nudges."""
    now = datetime.now(timezone.utc)
    query = (
        select(Nudge)
        .where(Nudge.status == "active")
        .where((Nudge.expires_at == None) | (Nudge.expires_at > now))
        .order_by(
            # Priority ordering: urgent > high > normal > low
            Nudge.created_at.desc()
        )
        .limit(50)
    )
    if target_role:
        query = query.where(Nudge.target_role == target_role)

    result = await db.execute(query)
    return list(result.scalars().all())


async def acknowledge_nudge(db: AsyncSession, nudge_id: int, acknowledged_by: str = "staff") -> Optional[Nudge]:
    """Mark a nudge as acknowledged."""
    result = await db.execute(select(Nudge).where(Nudge.id == nudge_id))
    nudge = result.scalar_one_or_none()
    if not nudge:
        return None
    nudge.status = "acknowledged"
    nudge.acknowledged_by = acknowledged_by
    nudge.acknowledged_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(nudge)
    return nudge


async def dismiss_nudge(db: AsyncSession, nudge_id: int) -> Optional[Nudge]:
    """Dismiss a nudge."""
    result = await db.execute(select(Nudge).where(Nudge.id == nudge_id))
    nudge = result.scalar_one_or_none()
    if not nudge:
        return None
    nudge.status = "dismissed"
    await db.commit()
    await db.refresh(nudge)
    return nudge


async def expire_old_nudges(db: AsyncSession) -> int:
    """Expire nudges past their TTL. Returns count of expired."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        update(Nudge)
        .where(Nudge.status == "active")
        .where(Nudge.expires_at != None)
        .where(Nudge.expires_at <= now)
        .values(status="expired")
    )
    await db.commit()
    return result.rowcount
