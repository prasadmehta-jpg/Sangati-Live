"""Zone Manager models - tables, areas, sections of the restaurant."""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    zone_type = Column(String(50), nullable=False)  # "dining", "bar", "patio", "kitchen", "entrance"
    capacity = Column(Integer, nullable=False, default=4)
    current_occupancy = Column(Integer, nullable=False, default=0)
    status = Column(String(30), nullable=False, default="available")  # "available", "occupied", "reserved", "cleaning"
    position_x = Column(Float, default=0.0)  # For floor-plan layout
    position_y = Column(Float, default=0.0)
    metadata_json = Column(JSON, default=dict)  # Extensible properties
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Sync-ready: track local changes for eventual sync
    sync_version = Column(Integer, default=0)
    is_synced = Column(Boolean, default=False)
