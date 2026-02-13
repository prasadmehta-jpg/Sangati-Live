from typing import Any
from app.rag.llm import llm_json

def _prompt(agent_name: str, intent: str, state: dict[str, Any], docs: list[dict[str, Any]]) -> str:
    return f"""
Return JSON with key "recommendations": list of objects:
{{
  "action": {{"action_type": str, "target": str, "payload": object}},
  "expected_impact": {{"speed":float,"quality":float,"labor":float,"margin":float}},
  "confidence": float,
  "reason": str,
  "citations": [{{"doc_id":str,"title":str,"excerpt":str,"score":float}}],
  "needs_human_approval": bool,
  "risk_score": float
}}

Hard constraints:
- never suggest pos.void / pos.refund / pos.comp
- only choose action_type from allowed list present in policy (enforced later)
- keep payload small and specific

Agent: {agent_name}
Intent: {intent}

State(JSON):
{state}

Knowledge snippets(JSON):
{docs}
""".strip()

async def plan(agent_name: str, intent: str, state: dict[str, Any], docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    data = await llm_json(_prompt(agent_name, intent, state, docs))
    recs = data.get("recommendations", [])
    if not isinstance(recs, list):
        return []
    return recs
