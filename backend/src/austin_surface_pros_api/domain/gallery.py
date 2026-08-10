from dataclasses import dataclass, replace
from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Protocol
from uuid import UUID


class GalleryPhotoStatus(StrEnum):
    UPLOADING = "uploading"
    READY = "ready"
    FAILED = "failed"


class GalleryPhotoNotFoundError(Exception):
    """Raised when a gallery photo does not exist."""


class InvalidGalleryPhotoError(ValueError):
    """Raised when gallery metadata cannot be safely published."""


@dataclass(frozen=True)
class GalleryPhoto:
    id: UUID
    title: str
    alt_text: str
    description: str
    tags: tuple[str, ...]
    city: str | None
    state: str | None
    captured_at: datetime | None
    crop_aspect: str
    crop_x: float
    crop_y: float
    crop_zoom: float
    staging_key: str | None
    image_key: str | None
    thumbnail_key: str | None
    width: int | None
    height: int | None
    sort_key: Decimal
    status: GalleryPhotoStatus
    uploader_id: UUID
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None

    def with_changes(self, **changes: object) -> GalleryPhoto:
        return replace(self, **changes)


@dataclass(frozen=True)
class GalleryPage:
    photos: tuple[GalleryPhoto, ...]
    next_cursor: str | None


class GalleryPhotoRepository(Protocol):
    async def add(self, photo: GalleryPhoto) -> GalleryPhoto: ...

    async def update(self, photo: GalleryPhoto) -> GalleryPhoto: ...

    async def delete(self, photo_id: UUID) -> None: ...

    async def get_by_id(self, photo_id: UUID) -> GalleryPhoto | None: ...

    async def list_ready_page(
        self,
        *,
        limit: int,
        after: tuple[Decimal, UUID] | None,
        tag: str | None,
    ) -> list[GalleryPhoto]: ...

    async def list_all(self) -> list[GalleryPhoto]: ...

    async def max_sort_key(self) -> Decimal | None: ...


def normalize_gallery_tags(values: list[str] | tuple[str, ...]) -> tuple[str, ...]:
    normalized: list[str] = []
    seen: set[str] = set()
    for value in values:
        tag = "-".join(value.strip().removeprefix("#").lower().split())
        tag = "".join(character for character in tag if character.isalnum() or character == "-")
        tag = tag.strip("-")
        if tag and tag not in seen:
            seen.add(tag)
            normalized.append(tag[:60])
    return tuple(normalized[:12])
