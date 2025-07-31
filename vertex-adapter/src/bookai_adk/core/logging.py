"""Structured logging configuration."""

import sys
import structlog
from prometheus_client import Counter, Histogram

from bookai_adk.core.config import get_settings


# Prometheus metrics
REQUEST_COUNT = Counter('bookai_requests_total', 'Total requests', ['agent_name', 'status'])
REQUEST_DURATION = Histogram('bookai_request_duration_seconds', 'Request duration', ['agent_name'])


def setup_logging() -> None:
    """Configure structured logging."""
    settings = get_settings()
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if settings.environment == "production" 
            else structlog.dev.ConsoleRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def log_agent_interaction(user_id: str, agent_name: str, latency_ms: float, status: str = "success") -> None:
    """Log agent interaction with metrics."""
    logger = structlog.get_logger()
    
    # Log structured data
    logger.info(
        "Agent interaction completed",
        user_id=user_id,
        agent_name=agent_name,
        latency_ms=latency_ms,
        status=status
    )
    
    # Update Prometheus metrics
    REQUEST_COUNT.labels(agent_name=agent_name, status=status).inc()
    REQUEST_DURATION.labels(agent_name=agent_name).observe(latency_ms / 1000)