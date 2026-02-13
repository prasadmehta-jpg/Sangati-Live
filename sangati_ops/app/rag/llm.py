import httpx, json
from app.core.settings import settings

async def llm_json(prompt: str) -> dict:
    if settings.LLM_PROVIDER == "none":
        # offline-safe stub: returns empty plan
        return {"recommendations": []}

    if settings.LLM_PROVIDER == "openai_compat":
        if not (settings.OPENAI_BASE_URL and settings.OPENAI_API_KEY and settings.OPENAI_MODEL):
            raise RuntimeError("OPENAI_BASE_URL/OPENAI_API_KEY/OPENAI_MODEL must be set for openai_compat")
        url = settings.OPENAI_BASE_URL.rstrip("/") + "/chat/completions"
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
        body = {
            "model": settings.OPENAI_MODEL,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role":"system","content":"You are Sangati Ops Planner. Output strict JSON only."},
                {"role":"user","content": prompt}
            ],
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(url, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)

    raise RuntimeError(f"Unknown LLM_PROVIDER={settings.LLM_PROVIDER}")
