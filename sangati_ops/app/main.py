from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.init_db import init_db
from app.schemas.contracts import RunAgentsRequest, IngestKnowledgeRequest
from app.services.agent_runner import run_all_agents
from app.services.knowledge import ingest_knowledge

app = FastAPI(title="Sangati Ops Agentic Runtime", version="0.1.0")

@app.on_event("startup")
def _startup():
    init_db()

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/v1/knowledge/ingest")
def v1_ingest(req: IngestKnowledgeRequest):
    doc_id = ingest_knowledge(req.venue_id, req.title, req.text, req.tags)
    return {"doc_id": doc_id}

@app.post("/v1/agents/run")
async def v1_agents_run(req: RunAgentsRequest, db: Session = Depends(get_db)):
    out = await run_all_agents(db=db, venue_id=req.venue_id, intent=req.intent, max_recs=req.max_recs)
    return out
