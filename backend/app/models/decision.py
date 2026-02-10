"""Decision Engine models - rule-based decisions and their outcomes."""

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    signal_ids = Column(JSON, nullable=False, default=list)  # IDs of signals that triggered this
    rule_name = Column(String(100), nullable=False)
    rule_description = Column(String(500), nullable=False)
    confidence = Column(Float, nullable=False, default=0.0)  # 0.0 to 1.0
    action_type = Column(String(50), nullable=False)
    # Types: "staff_move", "prep_alert", "table_turn", "greeting_prompt",
    #        "pace_adjust", "capacity_warning", "cleanup_dispatch"
    parameters = Column(JSON, default=dict)  # Action-specific parameters
    status = Column(String(30), default="pending")  # "pending", "nudged", "acted", "expired", "dismissed"
    explanation = Column(String(1000), nullable=False)  # Human-readable "why"
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sync_version = Column(Integer, default=0)
    is_synced = Column(Boolean, default=False)
