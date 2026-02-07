"""Signal Engine models - intent and pressure signals from zones."""

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    signal_type = Column(String(50), nullable=False)
    # Types: "occupancy_change", "dwell_time_high", "service_request",
    #        "wait_time_pressure", "table_turnover", "order_pace_slow",
    #        "guest_arrival", "payment_pending"
    intensity = Column(Float, nullable=False, default=0.5)  # 0.0 to 1.0
    source = Column(String(50), nullable=False, default="sensor")  # "sensor", "pos", "staff", "simulator"
    payload = Column(JSON, default=dict)  # Raw signal data
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

    sync_version = Column(Integer, default=0)
    is_synced = Column(Boolean, default=False)
