"""Pydantic schemas for API request/response serialization."""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ZoneOut(BaseModel):
    id: int
    name: str
    zone_type: str
    capacity: int
    current_occupancy: int
    status: str
    position_x: float
    position_y: float
    metadata_json: Optional[dict] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ZoneUpdate(BaseModel):
    occupancy: Optional[int] = None
    status: Optional[str] = None


class ZonePressureSummary(BaseModel):
    total_zones: int
    total_capacity: int
    total_occupancy: int
    occupancy_rate: float
    occupied_tables: int
    total_tables: int
    table_utilization: float
    zones_by_status: dict


class SignalOut(BaseModel):
    id: int
    zone_id: int
    signal_type: str
    intensity: float
    source: str
    payload: Optional[dict] = None
    is_demo: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DecisionOut(BaseModel):
    id: int
    signal_ids: Optional[list] = None
    rule_name: str
    rule_description: str
    confidence: float
    action_type: str
    parameters: Optional[dict] = None
    status: str
    explanation: str
    is_demo: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NudgeOut(BaseModel):
    id: int
    decision_id: int
    zone_id: Optional[int] = None
    target_role: str
    message: str
    priority: str
    explanation: str
    status: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    is_demo: bool
    created_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NudgeAction(BaseModel):
    action: str
    actor: Optional[str] = "staff"


class AuditLogOut(BaseModel):
    id: int
    event_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    actor: str
    summary: str
    details: Optional[dict] = None
    trace_chain: Optional[list] = None
    is_demo: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PipelineResult(BaseModel):
    signals_generated: int
    decisions_made: int
    nudges_created: int
    nudges_expired: Optional[int] = None


class DashboardState(BaseModel):
    zones: list[ZoneOut]
    active_nudges: list[NudgeOut]
    recent_signals: list[SignalOut]
    recent_decisions: list[DecisionOut]
    pressure_summary: ZonePressureSummary
