"""API routes - all REST endpoints for the Sangati platform."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.api import schemas
from app.core import zone_manager, signal_engine, decision_engine, nudge_generator, audit_service
from app.demo import simulator
from app.services import pipeline
from app.config import settings
from typing import Optional

router = APIRouter()


# ==================== Dashboard ====================

@router.get("/dashboard", response_model=schemas.DashboardState)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """Get the full dashboard state in a single call."""
    zones = await zone_manager.get_all_zones(db)
    active_nudges = await nudge_generator.get_active_nudges(db)
    recent_signals = await signal_engine.get_recent_signals(db, minutes=15)
    recent_decisions = await decision_engine.get_recent_decisions(db, limit=20)
    pressure = await zone_manager.get_zone_pressure_summary(db)

    current_scenario = None
    if settings.DEMO_MODE:
        current_scenario = simulator.get_current_scenario()

    return schemas.DashboardState(
        zones=[schemas.ZoneOut.model_validate(z) for z in zones],
        active_nudges=[schemas.NudgeOut.model_validate(n) for n in active_nudges],
        recent_signals=[schemas.SignalOut.model_validate(s) for s in recent_signals],
        recent_decisions=[schemas.DecisionOut.model_validate(d) for d in recent_decisions],
        pressure_summary=schemas.ZonePressureSummary(**pressure),
        demo_mode=settings.DEMO_MODE,
        current_scenario=current_scenario,
    )


# ==================== Zones ====================

@router.get("/zones", response_model=list[schemas.ZoneOut])
async def list_zones(db: AsyncSession = Depends(get_db)):
    zones = await zone_manager.get_all_zones(db)
    return [schemas.ZoneOut.model_validate(z) for z in zones]


@router.get("/zones/{zone_id}", response_model=schemas.ZoneOut)
async def get_zone(zone_id: int, db: AsyncSession = Depends(get_db)):
    zone = await zone_manager.get_zone(db, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return schemas.ZoneOut.model_validate(zone)


@router.patch("/zones/{zone_id}", response_model=schemas.ZoneOut)
async def update_zone(zone_id: int, data: schemas.ZoneUpdate, db: AsyncSession = Depends(get_db)):
    zone = None
    if data.occupancy is not None:
        zone = await zone_manager.update_zone_occupancy(db, zone_id, data.occupancy)
    if data.status is not None:
        zone = await zone_manager.update_zone_status(db, zone_id, data.status)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return schemas.ZoneOut.model_validate(zone)


@router.get("/zones/pressure/summary", response_model=schemas.ZonePressureSummary)
async def get_pressure_summary(db: AsyncSession = Depends(get_db)):
    return schemas.ZonePressureSummary(**(await zone_manager.get_zone_pressure_summary(db)))


# ==================== Signals ====================

@router.get("/signals", response_model=list[schemas.SignalOut])
async def list_signals(
    minutes: int = Query(15, ge=1, le=1440),
    zone_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    signals = await signal_engine.get_recent_signals(db, minutes=minutes, zone_id=zone_id)
    return [schemas.SignalOut.model_validate(s) for s in signals]


@router.get("/signals/active", response_model=list[schemas.SignalOut])
async def list_active_signals(db: AsyncSession = Depends(get_db)):
    signals = await signal_engine.get_active_signals(db)
    return [schemas.SignalOut.model_validate(s) for s in signals]


# ==================== Decisions ====================

@router.get("/decisions", response_model=list[schemas.DecisionOut])
async def list_decisions(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    decisions = await decision_engine.get_recent_decisions(db, limit=limit)
    return [schemas.DecisionOut.model_validate(d) for d in decisions]


@router.get("/decisions/pending", response_model=list[schemas.DecisionOut])
async def list_pending_decisions(db: AsyncSession = Depends(get_db)):
    decisions = await decision_engine.get_pending_decisions(db)
    return [schemas.DecisionOut.model_validate(d) for d in decisions]


# ==================== Nudges ====================

@router.get("/nudges", response_model=list[schemas.NudgeOut])
async def list_active_nudges(
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    nudges = await nudge_generator.get_active_nudges(db, target_role=role)
    return [schemas.NudgeOut.model_validate(n) for n in nudges]


@router.post("/nudges/{nudge_id}/action", response_model=schemas.NudgeOut)
async def nudge_action(nudge_id: int, data: schemas.NudgeAction, db: AsyncSession = Depends(get_db)):
    if data.action == "acknowledge":
        nudge = await nudge_generator.acknowledge_nudge(db, nudge_id, data.actor or "staff")
    elif data.action == "dismiss":
        nudge = await nudge_generator.dismiss_nudge(db, nudge_id)
    else:
        raise HTTPException(status_code=400, detail="Action must be 'acknowledge' or 'dismiss'")

    if not nudge:
        raise HTTPException(status_code=404, detail="Nudge not found")

    await audit_service.log_event(
        db,
        event_type=f"nudge_{data.action}d",
        entity_type="nudge",
        entity_id=nudge_id,
        actor=data.actor or "staff",
        summary=f"Nudge {nudge_id} {data.action}d by {data.actor or 'staff'}",
        is_demo=nudge.is_demo,
    )

    return schemas.NudgeOut.model_validate(nudge)


# ==================== Audit Log ====================

@router.get("/audit", response_model=list[schemas.AuditLogOut])
async def list_audit_log(
    limit: int = Query(100, ge=1, le=500),
    event_type: Optional[str] = None,
    entity_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    entries = await audit_service.get_audit_log(
        db, limit=limit, event_type=event_type, entity_type=entity_type
    )
    return [schemas.AuditLogOut.model_validate(e) for e in entries]


@router.get("/audit/trace/{nudge_id}", response_model=list[schemas.AuditLogOut])
async def get_nudge_trace(nudge_id: int, db: AsyncSession = Depends(get_db)):
    entries = await audit_service.get_trace_for_nudge(db, nudge_id)
    return [schemas.AuditLogOut.model_validate(e) for e in entries]


# ==================== Demo Controls ====================

@router.get("/demo/status")
async def demo_status():
    return {
        "demo_mode": settings.DEMO_MODE,
        "scenario": simulator.get_current_scenario(),
        "available_scenarios": list(simulator.SCENARIOS.keys()),
    }


@router.post("/demo/scenario")
async def set_scenario(data: schemas.ScenarioSelect):
    try:
        return simulator.set_scenario(data.scenario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/demo/toggle", response_model=dict)
async def toggle_demo(data: schemas.DemoModeToggle, db: AsyncSession = Depends(get_db)):
    settings.DEMO_MODE = data.enabled
    await audit_service.log_event(
        db,
        event_type="demo_mode_toggled",
        summary=f"Demo mode {'enabled' if data.enabled else 'disabled'}",
        actor="user",
        details={"demo_mode": data.enabled},
    )
    return {"demo_mode": settings.DEMO_MODE}


@router.post("/demo/reset")
async def reset_demo(db: AsyncSession = Depends(get_db)):
    result = await simulator.reset_simulation(db)
    await audit_service.log_event(
        db,
        event_type="simulation_reset",
        summary="Simulation reset to initial state",
        actor="user",
        is_demo=True,
    )
    return result


@router.post("/demo/tick", response_model=schemas.PipelineResult)
async def manual_tick(db: AsyncSession = Depends(get_db)):
    """Manually trigger one pipeline tick (useful for debugging)."""
    result = await pipeline.run_pipeline_tick(db, is_demo=settings.DEMO_MODE)
    return schemas.PipelineResult(**result)


# ==================== System ====================

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "demo_mode": settings.DEMO_MODE,
    }
