from typing import Any
from app.agents.base import Agent
from app.agents.planner import plan

class FloorOpsAgent(Agent):
    name = "floor_ops"

    async def run(self, venue_id: str, intent: str, state: dict[str, Any], docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return await plan(self.name, intent, state, docs)
