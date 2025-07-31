"""Application configuration."""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Server configuration
    port: int = int(os.getenv("PORT", "8000"))
    environment: str = os.getenv("ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "info")
    
    # Google Cloud configuration
    google_cloud_project: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    google_cloud_location: str = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    google_application_credentials: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    ai_model: str = os.getenv("AI_MODEL", "gemini-2.0-flash-exp")
    
    # Google Generative AI configuration (for LLM routing)
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()