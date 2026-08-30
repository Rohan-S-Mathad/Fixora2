import os
import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Fixora AI Bug Tracking API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Security
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "fixora-super-secret-dev-jwt-key-change-in-production-min32chars"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Development vs Production Auth flags
    ENABLE_DEV_AUTH_FALLBACK: bool = (
        os.getenv("ENABLE_DEV_AUTH_FALLBACK", "false").lower() == "true"
    )
    ENABLE_DEV_USER_SWITCHING: bool = (
        os.getenv("ENABLE_DEV_USER_SWITCHING", "false").lower() == "true"
    )

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "sqlite+aiosqlite:///./fixora.db"
    )
    SYNC_DATABASE_URL: str = os.getenv(
        "SYNC_DATABASE_URL", "sqlite:///./fixora.db"
    )

    # CORS
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
    )

    # AI & Scanner Feature Flags
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    AI_ENABLED: bool = os.getenv("AI_ENABLED", "true").lower() == "true"
    SECURITY_SCANNER_ENABLED: bool = (
        os.getenv("SECURITY_SCANNER_ENABLED", "true").lower() == "true"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["http://localhost:3000"]
        raw = self.CORS_ORIGINS.strip()
        if raw.startswith("[") and raw.endswith("]"):
            try:
                return json.loads(raw)
            except Exception:
                pass
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    def validate_production_settings(self) -> None:
        if self.ENVIRONMENT == "production":
            dev_secret = "fixora-super-secret-dev-jwt-key-change-in-production-min32chars"
            if not self.SECRET_KEY or self.SECRET_KEY == dev_secret or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "FATAL: Insecure or default SECRET_KEY in production! Set a cryptographically random SECRET_KEY >= 32 chars in production."
                )
            if "*" in self.cors_origins_list:
                raise ValueError(
                    "FATAL: Wildcard CORS '*' cannot be used with credentials in production! Configure explicit CORS_ORIGINS."
                )

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"


settings = Settings()
settings.validate_production_settings()
