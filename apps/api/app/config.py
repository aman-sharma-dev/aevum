from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://aevum:aevum@localhost:5432/wearable"
    cors_origins: list[str] = ["http://localhost:8081", "http://localhost:19006"]
    stale_after_seconds: int = 120

    model_config = SettingsConfigDict(env_file=".env", env_prefix="AEVUM_", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
