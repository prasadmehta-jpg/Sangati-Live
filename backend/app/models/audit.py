"""Audit Log models - complete trace of why the system acted."""

from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(50), nullable=False)
    # Types: "signal_received", "decision_made", "nudge_generated",
    #        "nudge_acknowledged", "nudge_expired", "zone_updated",
    #        "demo_mode_toggled", "system_start", "system_stop"
    entity_type = Column(String(50), nullable=True)  # "signal", "decision", "nudge", "zone"
    entity_id = Column(Integer, nullable=True)
    actor = Column(String(100), default="system")  # "system", "simulator", user identifier
    summary = Column(String(500), nullable=False)
    details = Column(JSON, default=dict)  # Full context snapshot
    trace_chain = Column(JSON, default=list)  # [signal_id -> decision_id -> nudge_id]
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sync_version = Column(Integer, default=0)
    is_synced = Column(Boolean, default=False)
