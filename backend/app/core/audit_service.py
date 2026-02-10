"""
Audit Service - Logs every system action with full traceability.

Every signal, decision, and nudge gets an audit trail entry.
The audit log answers "Why did the system do this?" at any point.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
from typing import Optional


async def log_event(
    db: AsyncSession,
    event_type: str,
    summary: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    actor: str = "system",
    details: Optional[dict] = None,
    trace_chain: Optional[list] = None,
    is_demo: bool = False,
) -> AuditLog:
    """Record an audit log entry."""
    entry = AuditLog(
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        actor=actor,
        summary=summary,
        details=details or {},
        trace_chain=trace_chain or [],
        is_demo=is_demo,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def get_audit_log(
    db: AsyncSession,
    limit: int = 100,
    event_type: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
) -> list[AuditLog]:
    """Retrieve audit log entries with optional filters."""
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if event_type:
        query = query.where(AuditLog.event_type == event_type)
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.where(AuditLog.entity_id == entity_id)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_trace_for_nudge(db: AsyncSession, nudge_id: int) -> list[AuditLog]:
    """Get the full audit trace chain for a specific nudge."""
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.entity_type == "nudge")
        .where(AuditLog.entity_id == nudge_id)
        .order_by(AuditLog.created_at.asc())
    )
    nudge_entries = list(result.scalars().all())

    # Also fetch related signal and decision entries from trace chain
    all_entries = list(nudge_entries)
    for entry in nudge_entries:
        for ref in entry.trace_chain or []:
            if isinstance(ref, dict):
                ref_type = ref.get("type")
                ref_id = ref.get("id")
                if ref_type and ref_id:
                    related = await db.execute(
                        select(AuditLog)
                        .where(AuditLog.entity_type == ref_type)
                        .where(AuditLog.entity_id == ref_id)
                    )
                    all_entries.extend(related.scalars().all())

    # Dedupe and sort
    seen = set()
    unique = []
    for e in all_entries:
        if e.id not in seen:
            seen.add(e.id)
            unique.append(e)
    unique.sort(key=lambda x: x.created_at)
    return unique
