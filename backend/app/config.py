"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "Intuiserve Sangati"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "sqlite+aiosqlite:///./sangati.db"
    DATABASE_PATH: str = "./sangati.db"

    # Demo mode: when True, the simulator generates fake signals
    DEMO_MODE: bool = True

    # Signal engine tick interval in seconds
    SIGNAL_TICK_INTERVAL: float = 5.0

    # Decision engine confidence threshold (0-1)
    DECISION_CONFIDENCE_THRESHOLD: float = 0.6

    # Nudge TTL in seconds before auto-expire
    NUDGE_TTL_SECONDS: int = 300

    # CORS origins (comma-separated)
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:8000"

    # Data directory for persistence
    DATA_DIR: str = "./data"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Ensure data directory exists
Path(settings.DATA_DIR).mkdir(parents=True, exist_ok=True)
