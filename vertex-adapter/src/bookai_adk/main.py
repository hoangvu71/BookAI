"""Main FastAPI application for BookAI ADK Orchestrator."""

import os
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from bookai_adk.api.routes import router
from bookai_adk.api.routing_routes import routing_router
from bookai_adk.core.config import get_settings
from bookai_adk.core.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    setup_logging()
    logger = structlog.get_logger()
    logger.info("BookAI ADK Service starting up...")
    
    yield
    
    # Shutdown
    logger.info("BookAI ADK Service shutting down...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title="BookAI ADK Agent Orchestrator",
        description="OpenAI-compatible API with intelligent agent routing",
        version="0.1.0",
        lifespan=lifespan,
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # API routes
    app.include_router(router)
    app.include_router(routing_router)
    
    # Metrics endpoint
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)
    
    return app


# Create the app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    uvicorn.run(
        "bookai_adk.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower(),
    )