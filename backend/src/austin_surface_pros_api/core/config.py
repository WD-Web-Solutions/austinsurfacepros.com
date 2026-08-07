from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="ASP_",
        extra="ignore",
    )

    app_name: str = "Austin Surface Pros API"
    api_prefix: str = "/api"
    environment: Literal["local", "test", "production"] = "local"
    log_level: str = "INFO"
    database_url: str | None = None
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:4200"])
