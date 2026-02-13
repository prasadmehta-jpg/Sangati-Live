import httpx
from tenacity import retry, stop_after_attempt, wait_fixed
from app.core.settings import settings

class POSBridgeClient:
    def __init__(self):
        self.base = settings.POSBRIDGE_BASE_URL.rstrip("/")
        self.token = settings.POSBRIDGE_TOKEN

    def _headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    @retry(stop=stop_after_attempt(3), wait=wait_fixed(1))
    async def get_snapshot(self, venue_id: str) -> dict:
        url = f"{self.base}/v1/snapshot"
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(url, headers=self._headers(), params={"venue_id": venue_id})
            r.raise_for_status()
            return r.json()
