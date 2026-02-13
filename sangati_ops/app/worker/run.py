import asyncio, json, time
import redis
from sqlalchemy.orm import Session
from app.core.settings import settings
from app.db.session import SessionLocal
from app.services.agent_runner import run_all_agents

QUEUE = "sangati:jobs"

def rconn():
    return redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

async def handle_job(payload: dict):
    venue_id = payload["venue_id"]
    intent = payload.get("intent","balanced")
    max_recs = int(payload.get("max_recs", 5))
    db: Session = SessionLocal()
    try:
        out = await run_all_agents(db=db, venue_id=venue_id, intent=intent, max_recs=max_recs)
        print(json.dumps({"job":"done","out":out}, ensure_ascii=False))
    finally:
        db.close()

async def main():
    r = rconn()
    while True:
        item = r.blpop(QUEUE, timeout=2)
        if not item:
            await asyncio.sleep(0.2)
            continue
        _, raw = item
        try:
            payload = json.loads(raw)
        except Exception:
            continue
        await handle_job(payload)

if __name__ == "__main__":
    asyncio.run(main())
