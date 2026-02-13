from typing import Any
from sqlalchemy.orm import Session
from app.services.router import AGENTS
from app.services.state_builder import build_state
from app.services.knowledge import retrieve_context
from app.policy.engine import load_policy, gate_recommendations
from app.services.optimizer import exhaustive_select
from app.services.audit import write_audit

async def run_all_agents(db: Session, venue_id: str, intent: str, max_recs: int) -> dict[str, Any]:
    policy = load_policy()
    state = await build_state(venue_id)
    docs = retrieve_context(venue_id, query=f"venue ops intent={intent} state anomalies", k=6)

    all_recs: list[dict[str, Any]] = []
    for agent in AGENTS:
        recs = await agent.run(venue_id=venue_id, intent=intent, state=state, docs=docs)
        # attach agent label
        for r in recs:
            r["agent"] = agent.name
        all_recs.extend(recs)

    # gate by policy
    gated = gate_recommendations(policy, all_recs)

    # bounded exhaustive selection ("bruteforce" within allowed actions)
    chosen = exhaustive_select(gated, max_pick=max_recs)

    # write one audit row per chosen action
    audit_ids = []
    for r in chosen:
        aid = write_audit(
            db=db,
            venue_id=venue_id,
            actor="agent",
            action_type=r.get("action", {}).get("action_type","unknown"),
            action_json=r,
            reason=r.get("reason",""),
            risk_score=float(r.get("risk_score", 0.0)),
        )
        audit_ids.append(aid)

    return {
        "venue_id": venue_id,
        "intent": intent,
        "policy_mode": policy.mode,
        "chosen": chosen,
        "audit_ids": audit_ids,
        "state_ts_ms": state.get("ts_ms"),
    }
