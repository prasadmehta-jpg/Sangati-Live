import yaml, os
from dataclasses import dataclass
from typing import Any
from app.core.settings import settings

@dataclass
class Policy:
    mode: str
    hard_rules: list[dict[str, Any]]
    allowed_actions: set[str]
    constraints: dict[str, Any]
    scoring: dict[str, Any]

def load_policy(path: str | None = None) -> Policy:
    p = path or settings.POLICY_FILE
    if not os.path.exists(p):
        raise FileNotFoundError(f"Policy file missing: {p}")
    with open(p, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return Policy(
        mode=data.get("mode","recommend_only"),
        hard_rules=data.get("hard_rules", []),
        allowed_actions=set(data.get("allowed_actions", [])),
        constraints=data.get("constraints", {}),
        scoring=data.get("scoring", {}),
    )

def is_action_allowed(policy: Policy, action_type: str) -> bool:
    if action_type not in policy.allowed_actions:
        return False
    for r in policy.hard_rules:
        deny = set(r.get("deny_actions", []))
        if action_type in deny:
            return False
    return True

def gate_recommendations(policy: Policy, recs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    max_actions = int(policy.constraints.get("max_actions_per_cycle", 5))
    max_risk = float(policy.constraints.get("max_risk_score", 0.35))
    for r in recs:
        a = r.get("action", {})
        at = a.get("action_type","")
        risk = float(r.get("risk_score", 0.0))
        if not is_action_allowed(policy, at):
            continue
        if risk > max_risk:
            continue
        out.append(r)
        if len(out) >= max_actions:
            break
    return out
