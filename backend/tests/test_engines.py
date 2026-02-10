"""Tests for core engines."""

import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.database import Base
from app.core import zone_manager, signal_engine, decision_engine, nudge_generator, audit_service


@pytest.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await engine.dispose()


@pytest.mark.asyncio
async def test_seed_zones(db):
    zones = await zone_manager.seed_zones(db)
    assert len(zones) == 12
    assert any(z.name == "Table 1" for z in zones)
    assert any(z.zone_type == "entrance" for z in zones)


@pytest.mark.asyncio
async def test_zone_occupancy_update(db):
    await zone_manager.seed_zones(db)
    zones = await zone_manager.get_all_zones(db)
    table = next(z for z in zones if z.zone_type == "dining")
    updated = await zone_manager.update_zone_occupancy(db, table.id, 3)
    assert updated.current_occupancy == 3
    assert updated.status == "occupied"


@pytest.mark.asyncio
async def test_pressure_summary(db):
    await zone_manager.seed_zones(db)
    summary = await zone_manager.get_zone_pressure_summary(db)
    assert summary["total_zones"] == 12
    assert summary["occupancy_rate"] == 0.0


@pytest.mark.asyncio
async def test_signal_generation(db):
    zones = await zone_manager.seed_zones(db)
    entrance = next(z for z in zones if z.zone_type == "entrance")
    await zone_manager.update_zone_occupancy(db, entrance.id, 10)
    signals = await signal_engine.evaluate_zone_signals(db, entrance, is_demo=False)
    assert len(signals) > 0


@pytest.mark.asyncio
async def test_decision_from_signal(db):
    zones = await zone_manager.seed_zones(db)
    entrance = next(z for z in zones if z.zone_type == "entrance")
    await zone_manager.update_zone_occupancy(db, entrance.id, 10)
    signals = await signal_engine.evaluate_zone_signals(db, entrance, is_demo=False)
    decisions = await decision_engine.evaluate_signals(db, signals)
    assert len(decisions) > 0
    assert all(d.explanation for d in decisions)


@pytest.mark.asyncio
async def test_nudge_generation(db):
    zones = await zone_manager.seed_zones(db)
    entrance = next(z for z in zones if z.zone_type == "entrance")
    await zone_manager.update_zone_occupancy(db, entrance.id, 10)
    signals = await signal_engine.evaluate_zone_signals(db, entrance, is_demo=False)
    decisions = await decision_engine.evaluate_signals(db, signals)
    nudges = await nudge_generator.generate_nudges(db, decisions)
    assert len(nudges) > 0
    assert all(n.message for n in nudges)
    assert all(n.explanation for n in nudges)


@pytest.mark.asyncio
async def test_audit_logging(db):
    await audit_service.log_event(
        db,
        event_type="test_event",
        summary="Test audit entry",
        actor="test",
    )
    entries = await audit_service.get_audit_log(db)
    assert len(entries) == 1
    assert entries[0].summary == "Test audit entry"
