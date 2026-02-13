from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
import os, time

TOKEN = os.getenv("POSBRIDGE_TOKEN", "posbridge-token-change-me")

app = FastAPI(title="Sangati POS Bridge (Mock)", version="0.1.0")

def now_ms():
    return int(time.time() * 1000)

def auth(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing token")
    if authorization.split(" ",1)[1].strip() != TOKEN:
        raise HTTPException(status_code=403, detail="bad token")

class Snapshot(BaseModel):
    venue_id: str

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/v1/snapshot")
def snapshot(venue_id: str, authorization: str | None = Header(default=None)):
    auth(authorization)
    # Replace this with real POS integration:
    # - official API pull
    # - local DB read (only if permitted)
    # - webhook relay
    # - KDS/KOT mirror
    return {
        "venue_id": venue_id,
        "taken_ms": now_ms(),
        "tables": [
            {"table_code":"T1","state":"seated","updated_ms": now_ms()-240000},
            {"table_code":"T2","state":"ordered","updated_ms": now_ms()-180000},
            {"table_code":"T3","state":"available","updated_ms": now_ms()-60000},
        ],
        "orders": [
            {
                "pos_order_id":"O1001",
                "table_code":"T2",
                "status":"sent",
                "opened_ms": now_ms()-210000,
                "last_updated_ms": now_ms()-120000,
                "items":[{"name":"Paneer Tikka","qty":1,"mods":["extra spicy"]}],
                "totals":{"subtotal":24.0,"tax":3.6,"total":27.6},
            }
        ],
        "staff": [
            {"staff_id":"S1","name":"Runner A","role":"runner","state":"available"},
            {"staff_id":"S2","name":"Server B","role":"server","state":"busy"},
        ]
    }
