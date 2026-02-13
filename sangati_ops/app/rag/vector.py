from qdrant_client import QdrantClient
from qdrant_client.http import models as qm
from app.core.settings import settings
import hashlib

def _fake_embed(text: str, dim: int = 256) -> list[float]:
    # deterministic hash embedding placeholder (offline-safe). replace with real embeddings later.
    h = hashlib.sha256(text.encode("utf-8")).digest()
    vals = [(b - 128) / 128.0 for b in h]
    out = (vals * ((dim // len(vals)) + 1))[:dim]
    return out

class VectorStore:
    def __init__(self):
        self.client = QdrantClient(url=settings.QDRANT_URL)
        self.collection = settings.QDRANT_COLLECTION

    def ensure(self):
        cols = [c.name for c in self.client.get_collections().collections]
        if self.collection in cols:
            return
        self.client.create_collection(
            collection_name=self.collection,
            vectors_config=qm.VectorParams(size=256, distance=qm.Distance.COSINE),
        )

    def upsert_doc(self, venue_id: str, doc_id: str, title: str, text: str, tags: list[str]):
        self.ensure()
        vec = _fake_embed(f"{title}\n{text}")
        payload = {"venue_id": venue_id, "doc_id": doc_id, "title": title, "text": text, "tags": tags}
        self.client.upsert(
            collection_name=self.collection,
            points=[qm.PointStruct(id=doc_id, vector=vec, payload=payload)],
        )

    def search(self, venue_id: str, query: str, limit: int = 5):
        self.ensure()
        qv = _fake_embed(query)
        hits = self.client.search(
            collection_name=self.collection,
            query_vector=qv,
            limit=limit,
            query_filter=qm.Filter(
                must=[qm.FieldCondition(key="venue_id", match=qm.MatchValue(value=venue_id))]
            )
        )
        out = []
        for h in hits:
            p = h.payload or {}
            out.append({
                "doc_id": p.get("doc_id", str(h.id)),
                "title": p.get("title", ""),
                "excerpt": (p.get("text","")[:240] + ("..." if len(p.get("text","")) > 240 else "")),
                "score": float(h.score or 0.0),
            })
        return out
