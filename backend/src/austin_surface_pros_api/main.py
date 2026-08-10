from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from austin_surface_pros_api.api.dependencies import (
    get_admin_service,
    get_auth_service,
    get_blog_service,
    get_contact_request_service,
    get_file_storage,
    get_gallery_service,
)
from austin_surface_pros_api.api.routes import (
    admin,
    auth,
    blog,
    blog_admin,
    contact_requests,
    gallery,
    gallery_admin,
    health,
)
from austin_surface_pros_api.core.config import Settings
from austin_surface_pros_api.core.gallery_storage import (
    S3GalleryObjectStorage,
    UnavailableGalleryObjectStorage,
)
from austin_surface_pros_api.core.logging import configure_logging
from austin_surface_pros_api.db.database import Database
from austin_surface_pros_api.domain.gallery_storage import GalleryObjectStorage
from austin_surface_pros_api.domain.storage import FileStorage
from austin_surface_pros_api.notifications.contact_requests import (
    ContactRequestNotifier,
    NoOpContactRequestNotifier,
    SesContactRequestNotifier,
)
from austin_surface_pros_api.services.admin import AdminService
from austin_surface_pros_api.services.auth import AuthService
from austin_surface_pros_api.services.blog import BlogService
from austin_surface_pros_api.services.contact_requests import ContactRequestService
from austin_surface_pros_api.services.gallery import GalleryService

ContactServiceProvider = Callable[[], ContactRequestService]
AuthServiceProvider = Callable[[], AuthService]
AdminServiceProvider = Callable[[], AdminService]
BlogServiceProvider = Callable[[], BlogService]
FileStorageProvider = Callable[[], FileStorage]
GalleryServiceProvider = Callable[[], GalleryService]


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


def create_gallery_object_storage(settings: Settings) -> GalleryObjectStorage:
    if not settings.enable_gallery_storage or settings.gallery_bucket_name is None:
        return UnavailableGalleryObjectStorage()

    import boto3
    from botocore.config import Config

    client: Any = boto3.client(
        "s3",
        region_name=settings.gallery_region,
        config=Config(signature_version="s3v4"),
    )
    return S3GalleryObjectStorage(
        client=client,
        bucket_name=settings.gallery_bucket_name,
        expires_in_seconds=settings.gallery_upload_expires_seconds,
    )


def create_app(
    settings: Settings | None = None,
    contact_service_provider: ContactServiceProvider | None = None,
    auth_service_provider: AuthServiceProvider | None = None,
    admin_service_provider: AdminServiceProvider | None = None,
    blog_service_provider: BlogServiceProvider | None = None,
    file_storage_provider: FileStorageProvider | None = None,
    gallery_service_provider: GalleryServiceProvider | None = None,
) -> FastAPI:
    resolved_settings = settings or Settings()
    configure_logging(resolved_settings.log_level)
    database = Database(
        resolved_settings.database_url if resolved_settings.enable_database else None
    )
    contact_request_notifier = create_contact_request_notifier(resolved_settings)
    gallery_object_storage = create_gallery_object_storage(resolved_settings)

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
    application.state.settings = resolved_settings
    application.state.contact_request_notifier = contact_request_notifier
    application.state.gallery_object_storage = gallery_object_storage

    if resolved_settings.cors_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=resolved_settings.cors_origins,
            allow_credentials=False,
            allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["Content-Type", "Authorization"],
        )

    application.mount(
        f"{resolved_settings.api_prefix}/uploads/blog",
        StaticFiles(directory=str(Path(resolved_settings.blog_uploads_dir)), check_dir=False),
        name="blog-uploads",
    )

    application.include_router(health.router, prefix=resolved_settings.api_prefix)
    application.include_router(contact_requests.router, prefix=resolved_settings.api_prefix)
    application.include_router(auth.router, prefix=resolved_settings.api_prefix)
    application.include_router(admin.router, prefix=resolved_settings.api_prefix)
    application.include_router(blog.router, prefix=resolved_settings.api_prefix)
    application.include_router(blog_admin.router, prefix=resolved_settings.api_prefix)
    application.include_router(gallery.router, prefix=resolved_settings.api_prefix)
    application.include_router(gallery_admin.router, prefix=resolved_settings.api_prefix)

    if contact_service_provider is not None:
        application.dependency_overrides[get_contact_request_service] = contact_service_provider

    if auth_service_provider is not None:
        application.dependency_overrides[get_auth_service] = auth_service_provider

    if admin_service_provider is not None:
        application.dependency_overrides[get_admin_service] = admin_service_provider

    if blog_service_provider is not None:
        application.dependency_overrides[get_blog_service] = blog_service_provider

    if file_storage_provider is not None:
        application.dependency_overrides[get_file_storage] = file_storage_provider

    if gallery_service_provider is not None:
        application.dependency_overrides[get_gallery_service] = gallery_service_provider

    return application


app = create_app()
