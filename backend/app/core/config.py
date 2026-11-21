"""Application configuration settings for FairFare backend.

Loads environment variables with fallback defaults for local development.
"""

import os
from typing import List, Union
from pydantic import ConfigDict, Field, field_validator

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:
    # Graceful fallback when pydantic-settings is not installed in the environment
    from pydantic import BaseModel

    class BaseSettings(BaseModel):
        """Minimal fallback for BaseSettings loading defaults and environment variables."""

        def __init__(self, **values):
            # Pre-populate fields from environment variables if present
            for field_name in self.model_fields.keys():
                env_val = os.getenv(field_name.upper()) or os.getenv(field_name.lower())
                if env_val is not None and field_name not in values:
                    values[field_name] = env_val
            super().__init__(**values)

    SettingsConfigDict = ConfigDict


class Settings(BaseSettings):
    """FairFare Core Application Settings."""

    # Project Information
    PROJECT_NAME: str = "FairFare"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENV: str = "development"
    DEBUG: bool = True

    # Database Configuration (PostgreSQL + asyncpg)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/fairfare"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Redis Cache & Message Broker
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security & JWT Tokens
    # No hard-coded default: an empty value gets a random per-process key in
    # development (tokens reset on restart) and is a startup error in production.
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Rate Limiting
    API_RATE_LIMIT_PER_MINUTE: int = 60

    # Flight Supplier API Defaults
    SUPPLIER_DEFAULT_TIMEOUT_SECONDS: int = 15
    SUPPLIER_MAX_RETRIES: int = 3

    # CORS Allowed Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse comma-separated origins if provided as a string."""
        if isinstance(v, str):
            if v.strip().startswith("[") and v.strip().endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


def _ensure_jwt_secret(cfg: "Settings") -> None:
    """Refuse weak secrets in production; generate an ephemeral one in dev."""
    import secrets as _secrets

    if cfg.JWT_SECRET_KEY:
        if cfg.ENV == "production" and len(cfg.JWT_SECRET_KEY) < 32:
            raise RuntimeError("JWT_SECRET_KEY must be at least 32 characters in production")
        return
    if cfg.ENV == "production":
        raise RuntimeError("JWT_SECRET_KEY must be set in production")
    cfg.JWT_SECRET_KEY = _secrets.token_urlsafe(48)


# Global singleton settings instance
settings = Settings()
_ensure_jwt_secret(settings)
