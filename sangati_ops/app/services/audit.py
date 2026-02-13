import json
from sqlalchemy.orm import Session
from app.core.logging import audit_id, now_ms
from app.models.entities import AuditLog

def write_audit(db: Session, venue_id: str, actor: str, action_type: str, action_json: dict, reason: str, risk_score: float) -> str:
    aid = audit_id()[:32]
    row = AuditLog(
        id=aid,
        venue_id=venue_id,
        actor=actor,
        action_type=action_type,
        action_json=json.dumps(action_json, ensure_ascii=False),
        reason=reason,
        risk_score=float(risk_score),
        created_ms=now_ms(),
    )
    db.add(row)
    db.commit()
    return aid
