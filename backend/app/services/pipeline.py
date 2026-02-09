"""
Operations Pipeline - Orchestrates the signal->decision->nudge flow.

Triggered on-demand when zone data changes via API.
No fake data generation.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.core import signal_engine, decision_engine, nudge_generator, audit_service
from app.database import async_session_factory


async def run_pipeline(db: AsyncSession) -> dict:
    """Execute one full pipeline cycle. Called after zone updates."""
    result = {
        "signals_generated": 0,
        "decisions_made": 0,
        "nudges_created": 0,
    }

    # Signal Engine evaluates all zones
    signals = await signal_engine.evaluate_all_zones(db, is_demo=False)
    result["signals_generated"] = len(signals)

    for sig in signals:
        await audit_service.log_event(
            db,
            event_type="signal_received",
            entity_type="signal",
            entity_id=sig.id,
            summary=f"Signal '{sig.signal_type}' from zone {sig.zone_id} (intensity: {sig.intensity})",
            actor="signal_engine",
            details={"signal_type": sig.signal_type, "zone_id": sig.zone_id, "intensity": sig.intensity},
        )

    # Decision Engine processes signals
    if signals:
        decisions = await decision_engine.evaluate_signals(db, signals)
        result["decisions_made"] = len(decisions)

        for dec in decisions:
            await audit_service.log_event(
                db,
                event_type="decision_made",
                entity_type="decision",
                entity_id=dec.id,
                summary=f"Decision '{dec.rule_name}': {dec.action_type} (confidence: {dec.confidence})",
                actor="decision_engine",
                details={
                    "rule_name": dec.rule_name,
                    "action_type": dec.action_type,
                    "confidence": dec.confidence,
                    "signal_ids": dec.signal_ids,
                },
                trace_chain=[{"type": "signal", "id": sid} for sid in (dec.signal_ids or [])],
            )

        # Nudge Generator creates nudges from decisions
        if decisions:
            nudges = await nudge_generator.generate_nudges(db, decisions)
            result["nudges_created"] = len(nudges)

            for nudge in nudges:
                await audit_service.log_event(
                    db,
                    event_type="nudge_generated",
                    entity_type="nudge",
                    entity_id=nudge.id,
                    summary=f"Nudge for {nudge.target_role}: {nudge.message}",
                    actor="nudge_generator",
                    details={
                        "target_role": nudge.target_role,
                        "priority": nudge.priority,
                        "message": nudge.message,
                        "decision_id": nudge.decision_id,
                    },
                    trace_chain=[
                        {"type": "decision", "id": nudge.decision_id},
                    ],
                )

    # Expire old nudges
    expired_count = await nudge_generator.expire_old_nudges(db)
    if expired_count > 0:
        result["nudges_expired"] = expired_count

    return result


async def run_expiry_tick():
    """Periodic task: expire old nudges. No data generation."""
    async with async_session_factory() as db:
        try:
            await nudge_generator.expire_old_nudges(db)
        except Exception as e:
            await db.rollback()
            print(f"Expiry tick error: {e}")
