import uuid
from app.rag.vector import VectorStore

def ingest_knowledge(venue_id: str, title: str, text: str, tags: list[str]) -> str:
    vs = VectorStore()
    doc_id = uuid.uuid4().hex
    vs.upsert_doc(venue_id=venue_id, doc_id=doc_id, title=title, text=text, tags=tags)
    return doc_id

def retrieve_context(venue_id: str, query: str, k: int = 5) -> list[dict]:
    vs = VectorStore()
    return vs.search(venue_id=venue_id, query=query, limit=k)
