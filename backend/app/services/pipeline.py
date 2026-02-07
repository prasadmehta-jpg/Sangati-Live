"""
Operations Pipeline - Orchestrates the full signal->decision->nudge flow.

This is the main processing loop:
1. Simulator generates zone changes (demo mode) OR real sensors push data
2. Signal Engine evaluates zones and generates signals
3. Decision Engine applies rules to signals
4. Nudge Generator creates human-readable actions
5. Audit Service logs everything

The pipeline runs on a configurable interval.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.core import signal_engine, decision_engine, nudge_generator, audit_service
from app.demo import simulator
from app.config import settings
from app.database import async_session_factory


async def run_pipeline_tick(db: AsyncSession, is_demo: bool = True) -> dict:
    """Execute one full pipeline cycle."""
    result = {
        "demo_changes": None,
        "signals_generated": 0,
        "decisions_made": 0,
        "nudges_created": 0,
    }

    # Step 1: Simulate zone changes (demo mode only)
    if is_demo:
        sim_result = await simulator.simulate_tick(db)
        result["demo_changes"] = sim_result

        await audit_service.log_event(
            db,
            event_type="simulation_tick",
            summary=f"Simulator tick #{sim_result['tick']}: {sim_result['total_changes']} zone changes",
            actor="simulator",
            details=sim_result,
            is_demo=True,
        )

    # Step 2: Signal Engine evaluates all zones
    signals = await signal_engine.evaluate_all_zones(db, is_demo=is_demo)
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
            is_demo=sig.is_demo,
        )

    # Step 3: Decision Engine processes signals
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
                is_demo=dec.is_demo,
            )

        # Step 4: Nudge Generator creates nudges from decisions
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
                    is_demo=nudge.is_demo,
                )

    # Step 5: Expire old nudges
    expired_count = await nudge_generator.expire_old_nudges(db)
    if expired_count > 0:
        result["nudges_expired"] = expired_count

    return result


async def run_background_tick():
    """Run a pipeline tick using a fresh DB session. Used by the scheduler."""
    async with async_session_factory() as db:
        try:
            result = await run_pipeline_tick(db, is_demo=settings.DEMO_MODE)
            return result
        except Exception as e:
            await db.rollback()
            print(f"Pipeline tick error: {e}")
            return {"error": str(e)}
