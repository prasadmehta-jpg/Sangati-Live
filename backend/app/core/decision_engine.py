"""
Decision Engine - Rule-based, deterministic decision-making.

Takes signals as input, applies a set of rules, and produces decisions.
Each rule has:
  - Trigger conditions (signal types + intensity thresholds)
  - Action to recommend
  - Confidence score
  - Human-readable explanation

This is NOT fake ML. It is an explicit rule engine that is ML-ready:
rules can be replaced or augmented by a trained model in the future
without changing the interface.
"""

from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.signal import Signal
from app.models.decision import Decision
from app.config import settings
from typing import Optional


# Rule definitions: each rule maps signal patterns to decisions
RULES = [
    {
        "name": "seat_waiting_guests",
        "description": "When entrance has waiting guests and a table is available or about to turn, prompt host to seat",
        "trigger": {
            "requires_signal": "wait_time_pressure",
            "min_intensity": 0.5,
            "zone_types": ["entrance"],
        },
        "action_type": "greeting_prompt",
        "confidence_base": 0.8,
        "explanation_template": "There are {waiting} guests waiting at the entrance (pressure intensity: {intensity}). Recommending immediate seating action.",
    },
    {
        "name": "expedite_table_turn",
        "description": "When a table is in cleaning status and entrance has pressure, speed up the turn",
        "trigger": {
            "requires_signal": "table_turnover",
            "min_intensity": 0.2,
            "zone_types": ["dining"],
        },
        "action_type": "cleanup_dispatch",
        "confidence_base": 0.75,
        "explanation_template": "Zone '{zone_name}' needs clearing and guests are waiting. Dispatching busser to expedite turnover.",
    },
    {
        "name": "manage_high_occupancy",
        "description": "When dining zone is at capacity, alert manager to monitor service pace",
        "trigger": {
            "requires_signal": "wait_time_pressure",
            "min_intensity": 0.7,
            "zone_types": ["dining", "bar"],
        },
        "action_type": "pace_adjust",
        "confidence_base": 0.7,
        "explanation_template": "Zone '{zone_name}' is at {occupancy_rate}% capacity. Service pace monitoring recommended to prevent bottlenecks.",
    },
    {
        "name": "greet_new_arrivals",
        "description": "When guests arrive at a table, prompt server to greet within 60 seconds",
        "trigger": {
            "requires_signal": "guest_arrival",
            "min_intensity": 0.3,
            "zone_types": ["dining"],
        },
        "action_type": "greeting_prompt",
        "confidence_base": 0.9,
        "explanation_template": "{guests} new guests seated at '{zone_name}'. Server should greet within 60 seconds.",
    },
    {
        "name": "capacity_warning",
        "description": "When overall restaurant pressure is high, warn manager",
        "trigger": {
            "requires_signal": "wait_time_pressure",
            "min_intensity": 0.8,
            "zone_types": ["entrance"],
        },
        "action_type": "capacity_warning",
        "confidence_base": 0.85,
        "explanation_template": "Entrance wait area at {waiting} guests (intensity: {intensity}). Consider activating overflow seating or updating wait time estimates.",
    },
]


async def evaluate_signals(db: AsyncSession, signals: list[Signal]) -> list[Decision]:
    """Apply all rules to the given signals and produce decisions."""
    decisions = []

    for signal in signals:
        for rule in RULES:
            trigger = rule["trigger"]

            # Check signal type match
            if signal.signal_type != trigger["requires_signal"]:
                continue

            # Check intensity threshold
            if signal.intensity < trigger["min_intensity"]:
                continue

            # Check zone type if specified (need to look up zone)
            if trigger.get("zone_types"):
                from app.models.zone import Zone
                zone_result = await db.execute(select(Zone).where(Zone.id == signal.zone_id))
                zone = zone_result.scalar_one_or_none()
                if not zone or zone.zone_type not in trigger["zone_types"]:
                    continue

            # Check for duplicate recent decisions from this rule + zone
            recent_check = await db.execute(
                select(Decision)
                .where(Decision.rule_name == rule["name"])
                .where(Decision.status.in_(["pending", "nudged"]))
                .where(Decision.created_at > datetime.now(timezone.utc).replace(second=0, microsecond=0))
            )
            if recent_check.scalars().first():
                continue

            # Build confidence: base + intensity modifier
            confidence = min(1.0, rule["confidence_base"] + (signal.intensity - trigger["min_intensity"]) * 0.2)

            if confidence < settings.DECISION_CONFIDENCE_THRESHOLD:
                continue

            # Build explanation from template
            payload = signal.payload or {}
            zone_name = zone.name if zone else f"Zone {signal.zone_id}"
            explanation = rule["explanation_template"].format(
                waiting=payload.get("waiting_guests", "?"),
                intensity=round(signal.intensity, 2),
                zone_name=zone_name,
                occupancy_rate=round(payload.get("occupancy_rate", 0) * 100, 1),
                guests=payload.get("guests", "?"),
            )

            decision = Decision(
                signal_ids=[signal.id],
                rule_name=rule["name"],
                rule_description=rule["description"],
                confidence=round(confidence, 2),
                action_type=rule["action_type"],
                parameters={
                    "zone_id": signal.zone_id,
                    "zone_name": zone_name,
                    "signal_intensity": signal.intensity,
                },
                explanation=explanation,
                is_demo=signal.is_demo,
            )
            db.add(decision)
            decisions.append(decision)

    if decisions:
        await db.commit()
        for d in decisions:
            await db.refresh(d)

    return decisions


async def get_pending_decisions(db: AsyncSession) -> list[Decision]:
    result = await db.execute(
        select(Decision)
        .where(Decision.status.in_(["pending", "nudged"]))
        .order_by(Decision.created_at.desc())
        .limit(50)
    )
    return list(result.scalars().all())


async def get_recent_decisions(db: AsyncSession, limit: int = 50) -> list[Decision]:
    result = await db.execute(
        select(Decision).order_by(Decision.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())
