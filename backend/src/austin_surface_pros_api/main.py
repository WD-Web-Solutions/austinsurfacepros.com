from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from austin_surface_pros_api.api.dependencies import get_contact_request_service
from austin_surface_pros_api.api.routes import contact_requests, health
from austin_surface_pros_api.core.config import Settings
from austin_surface_pros_api.core.logging import configure_logging
from austin_surface_pros_api.db.database import Database
from austin_surface_pros_api.notifications.contact_requests import (
    ContactRequestNotifier,
    NoOpContactRequestNotifier,
    SesContactRequestNotifier,
)
from austin_surface_pros_api.services.contact_requests import ContactRequestService

ContactServiceProvider = Callable[[], ContactRequestService]


def create_contact_request_notifier(settings: Settings) -> ContactRequestNotifier:
    if not settings.enable_ses:
        return NoOpContactRequestNotifier()

    import boto3

    client: Any = boto3.client("sesv2", region_name=settings.ses_region)
    return SesContactRequestNotifier(
        client=client,
        source_email=settings.ses_source_email or "",
        recipient_emails=tuple(settings.ses_recipient_emails),
    )


def create_app(
    settings: Settings | None = None,
    contact_service_provider: ContactServiceProvider | None = None,
) -> FastAPI:
    resolved_settings = settings or Settings()
    configure_logging(resolved_settings.log_level)
    database = Database(
        resolved_settings.database_url if resolved_settings.enable_database else None
    )
    contact_request_notifier = create_contact_request_notifier(resolved_settings)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        yield
        await database.dispose()

    application = FastAPI(
        title=resolved_settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
    )
    application.state.database = database
    application.state.contact_request_notifier = contact_request_notifier

    if resolved_settings.cors_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=resolved_settings.cors_origins,
            allow_credentials=False,
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["Content-Type"],
        )

    application.include_router(health.router, prefix=resolved_settings.api_prefix)
    application.include_router(contact_requests.router, prefix=resolved_settings.api_prefix)

    if contact_service_provider is not None:
        application.dependency_overrides[get_contact_request_service] = contact_service_provider

    return application


app = create_app()
