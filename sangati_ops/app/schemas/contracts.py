from pydantic import BaseModel, Field
from typing import Any, Literal

class POSOrder(BaseModel):
    pos_order_id: str
    table_code: str
    status: str
    opened_ms: int
    last_updated_ms: int
    items: list[dict[str, Any]] = Field(default_factory=list)
    totals: dict[str, Any] = Field(default_factory=dict)

class POSSnapshot(BaseModel):
    venue_id: str
    taken_ms: int
    tables: list[dict[str, Any]] = Field(default_factory=list)
    orders: list[POSOrder] = Field(default_factory=list)
    staff: list[dict[str, Any]] = Field(default_factory=list)

class RetrievedDoc(BaseModel):
    doc_id: str
    title: str
    excerpt: str
    score: float

class Action(BaseModel):
    action_type: str
    target: str
    payload: dict[str, Any] = Field(default_factory=dict)

class Recommendation(BaseModel):
    action: Action
    expected_impact: dict[str, float] = Field(default_factory=dict)
    confidence: float = 0.5
    reason: str
    citations: list[RetrievedDoc] = Field(default_factory=list)
    needs_human_approval: bool = True
    risk_score: float = 0.0

class AgentOutput(BaseModel):
    agent: str
    audit_event_id: str
    recommendations: list[Recommendation] = Field(default_factory=list)

class RunAgentsRequest(BaseModel):
    venue_id: str
    intent: Literal["speed","quality","labor","margin","balanced"] = "balanced"
    max_recs: int = 5

class IngestKnowledgeRequest(BaseModel):
    venue_id: str
    title: str
    text: str
    tags: list[str] = Field(default_factory=list)
