from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

INSECURE_DEFAULT_JWT_SECRET_KEY = "insecure-local-development-secret"


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
    jwt_secret_key: str = INSECURE_DEFAULT_JWT_SECRET_KEY
    jwt_algorithm: str = "HS256"
    jwt_access_token_expires_minutes: int = 60
    blog_uploads_dir: str = "uploads/blog"

    @model_validator(mode="after")
    def validate_integrations(self) -> "Settings":
        if self.enable_database and self.database_url is None:
            raise ValueError("database_url is required when enable_database is true")
        if self.enable_ses and (self.ses_source_email is None or not self.ses_recipient_emails):
            raise ValueError(
                "ses_source_email and ses_recipient_emails are required when enable_ses is true"
            )
        if (
            self.environment == "production"
            and self.jwt_secret_key == INSECURE_DEFAULT_JWT_SECRET_KEY
        ):
            raise ValueError("ASP_JWT_SECRET_KEY must be set to a real secret in production")
        return self
