from abc import ABC, abstractmethod
from typing import Any

class Agent(ABC):
    name: str

    @abstractmethod
    async def run(self, venue_id: str, intent: str, state: dict[str, Any], docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        raise NotImplementedError
