import json, time, uuid
from typing import Any

def now_ms() -> int:
    return int(time.time() * 1000)

def audit_id() -> str:
    return uuid.uuid4().hex

def jlog(event: str, **fields: Any) -> str:
    payload = {"ts_ms": now_ms(), "event": event, **fields}
    return json.dumps(payload, ensure_ascii=False)
