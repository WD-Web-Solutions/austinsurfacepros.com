from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="ASP_",
        extra="ignore",
    )

    app_name: str = "Austin Surface Pros API"
    api_prefix: str = "/api"
    environment: Literal["local", "test", "demo", "production"] = "local"
    log_level: str = "INFO"
    enable_database: bool = False
    database_url: str | None = None
    enable_ses: bool = False
    ses_region: str = "us-east-1"
    ses_source_email: str | None = None
    ses_recipient_emails: list[str] = Field(default_factory=list)
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:4200"])

    @model_validator(mode="after")
    def validate_integrations(self) -> Settings:
        if self.enable_database and self.database_url is None:
            raise ValueError("database_url is required when enable_database is true")
        if self.enable_ses and (self.ses_source_email is None or not self.ses_recipient_emails):
            raise ValueError(
                "ses_source_email and ses_recipient_emails are required when enable_ses is true"
            )
        return self
