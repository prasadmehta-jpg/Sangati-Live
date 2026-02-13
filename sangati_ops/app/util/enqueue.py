import json
import redis
from app.core.settings import settings

QUEUE = "sangati:jobs"

def enqueue(venue_id: str, intent: str = "balanced", max_recs: int = 5):
    r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    r.rpush(QUEUE, json.dumps({"venue_id": venue_id, "intent": intent, "max_recs": max_recs}))

if __name__ == "__main__":
    enqueue("demo_venue", "balanced", 5)
