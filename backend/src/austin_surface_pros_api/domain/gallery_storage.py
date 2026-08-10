from dataclasses import dataclass
from typing import Protocol
from uuid import UUID


class GalleryStorageUnavailableError(RuntimeError):
    """Raised when gallery object storage is not configured."""


class GalleryUploadNotFoundError(Exception):
    """Raised when a staged upload is missing or has expired."""


class InvalidGalleryImageError(ValueError):
    """Raised when staged bytes are not a safe, supported image."""


@dataclass(frozen=True)
class PresignedGalleryUpload:
    url: str
    key: str
    headers: dict[str, str]
    expires_in_seconds: int


@dataclass(frozen=True)
class ProcessedGalleryImage:
    image_key: str
    thumbnail_key: str
    width: int
    height: int


class GalleryObjectStorage(Protocol):
    async def create_upload(
        self,
        *,
        photo_id: UUID,
        content_type: str,
    ) -> PresignedGalleryUpload: ...

    async def process_upload(
        self,
        *,
        photo_id: UUID,
        staging_key: str,
    ) -> ProcessedGalleryImage: ...

    async def delete_objects(self, keys: tuple[str, ...]) -> None: ...
