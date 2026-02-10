"""Nudge Generator models - human-readable action recommendations."""

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Nudge(Base):
    __tablename__ = "nudges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    target_role = Column(String(50), nullable=False)  # "server", "host", "manager", "kitchen", "busser"
    message = Column(String(500), nullable=False)  # Plain English nudge
    priority = Column(String(20), nullable=False, default="normal")  # "low", "normal", "high", "urgent"
    explanation = Column(String(1000), nullable=False)  # "Why am I seeing this?"
    status = Column(String(30), default="active")  # "active", "acknowledged", "dismissed", "expired"
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    is_demo = Column(Boolean, default=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

    sync_version = Column(Integer, default=0)
    is_synced = Column(Boolean, default=False)
