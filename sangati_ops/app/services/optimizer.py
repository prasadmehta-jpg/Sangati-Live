from typing import Any
import itertools
from app.policy.engine import load_policy

def score_action(action: dict[str, Any], weights: dict[str, float]) -> float:
    impact = action.get("expected_impact", {}) or {}
    s = 0.0
    for k, w in weights.items():
        s += float(impact.get(k, 0.0)) * float(w)
    # risk penalty
    s -= float(action.get("risk_score", 0.0)) * 1.5
    # low confidence penalty
    s -= (1.0 - float(action.get("confidence", 0.5))) * 0.25
    return s

def exhaustive_select(recs: list[dict[str, Any]], max_pick: int) -> list[dict[str, Any]]:
    # bounded exhaustive selection to avoid combinatorial blowup
    if not recs:
        return []
    policy = load_policy()
    weights = (policy.scoring.get("weights") or {"speed":0.4,"quality":0.25,"labor":0.2,"margin":0.15})
    # pre-score each rec
    scored = [(score_action(r, weights), r) for r in recs]
    scored.sort(key=lambda x: x[0], reverse=True)
    top = [r for _, r in scored[: min(12, len(scored))]]

    best_combo = []
    best_score = float("-inf")
    max_pick = max(1, max_pick)

    for k in range(1, min(max_pick, len(top)) + 1):
        for combo in itertools.combinations(top, k):
            # simple conflict check: do not duplicate same target+type
            seen = set()
            ok = True
            for r in combo:
                a = r.get("action", {})
                key = (a.get("action_type",""), a.get("target",""))
                if key in seen:
                    ok = False
                    break
                seen.add(key)
            if not ok:
                continue
            s = sum(score_action(r, weights) for r in combo)
            if s > best_score:
                best_score = s
                best_combo = list(combo)

    return best_combo
