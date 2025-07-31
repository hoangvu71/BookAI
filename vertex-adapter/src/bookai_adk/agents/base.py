"""Base agent class."""

from abc import ABC, abstractmethod
from typing import Dict, Any
import time
import structlog


class BaseAgent(ABC):
    """Base class for all BookAI agents."""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.logger = structlog.get_logger().bind(agent=name)
    
    @abstractmethod
    async def process_query(self, query: str, context: Dict[str, Any] = None) -> str:
        """Process a user query and return a response."""
        pass
    
    async def _log_interaction(self, query: str, response: str, latency_ms: float) -> None:
        """Log agent interaction."""
        self.logger.info(
            "Agent interaction",
            query_length=len(query),
            response_length=len(response),
            latency_ms=latency_ms
        )