from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Voting Platform API"
    app_env: str = "dev"
    app_host: str = "127.0.0.1"
    app_port: int = 8000

    # On Windows, "localhost" may resolve to IPv6 (::1) and cause odd connection issues.
    database_url: str = "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/voting_platform"

    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


settings = Settings()

