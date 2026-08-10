from datetime import UTC, datetime
from decimal import Decimal
from typing import cast
from uuid import UUID

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from austin_surface_pros_api.db.models import GalleryPhotoRecord
from austin_surface_pros_api.db.repositories import SqlAlchemyGalleryPhotoRepository
from austin_surface_pros_api.domain.gallery import (
    GalleryPhoto,
    GalleryPhotoNotFoundError,
    GalleryPhotoStatus,
)
from tests.test_blog_repository import FakeSession

PHOTO_ID = UUID("33333333-3333-3333-3333-333333333333")
UPLOADER_ID = UUID("11111111-1111-1111-1111-111111111111")
NOW = datetime(2026, 8, 10, 12, 0, tzinfo=UTC)


def make_photo(**overrides: object) -> GalleryPhoto:
    defaults: dict[str, object] = {
        "id": PHOTO_ID,
        "title": "Downtown deck",
        "alt_text": "Fresh striping on a parking deck",
        "description": "Completed overnight.",
        "tags": ("striping", "night-work"),
        "city": "Austin",
        "state": "Texas",
        "captured_at": None,
        "crop_aspect": "16:9",
        "crop_x": 50,
        "crop_y": 45,
        "crop_zoom": 1.2,
        "staging_key": None,
        "image_key": "gallery-media/processed/3/display.webp",
        "thumbnail_key": "gallery-media/processed/3/thumbnail.webp",
        "width": 1600,
        "height": 900,
        "sort_key": Decimal("1024"),
        "status": GalleryPhotoStatus.READY,
        "uploader_id": UPLOADER_ID,
        "created_at": NOW,
        "updated_at": NOW,
        "published_at": NOW,
    }
    defaults.update(overrides)
    return GalleryPhoto(**defaults)


def make_record(**overrides: object) -> GalleryPhotoRecord:
    photo = make_photo(**overrides)
    return GalleryPhotoRecord(
        id=photo.id,
        title=photo.title,
        alt_text=photo.alt_text,
        description=photo.description,
        tags=list(photo.tags),
        city=photo.city,
        state=photo.state,
        captured_at=photo.captured_at,
        crop_aspect=photo.crop_aspect,
        crop_x=photo.crop_x,
        crop_y=photo.crop_y,
        crop_zoom=photo.crop_zoom,
        staging_key=photo.staging_key,
        image_key=photo.image_key,
        thumbnail_key=photo.thumbnail_key,
        width=photo.width,
        height=photo.height,
        sort_key=photo.sort_key,
        status=photo.status.value,
        uploader_id=photo.uploader_id,
        created_at=photo.created_at,
        updated_at=photo.updated_at,
        published_at=photo.published_at,
    )


@pytest.mark.asyncio
async def test_add_gallery_photo_maps_every_field() -> None:
    session = FakeSession()
    repository = SqlAlchemyGalleryPhotoRepository(cast(AsyncSession, session))
    photo = make_photo()

    result = await repository.add(photo)

    assert result is photo
    record = session.added[0]
    assert isinstance(record, GalleryPhotoRecord)
    assert record.tags == ["striping", "night-work"]
    assert record.status == "ready"
    assert session.flushed is True


@pytest.mark.asyncio
async def test_update_gallery_photo_mutates_and_maps_record() -> None:
    record = make_record()
    session = FakeSession(records={PHOTO_ID: record})
    repository = SqlAlchemyGalleryPhotoRepository(cast(AsyncSession, session))

    result = await repository.update(
        make_photo(
            title="Updated deck",
            tags=("striping",),
            sort_key=Decimal("2048"),
        )
    )

    assert result.title == "Updated deck"
    assert result.sort_key == Decimal("2048")
    assert record.tags == ["striping"]


@pytest.mark.asyncio
async def test_update_and_delete_missing_gallery_photo_raise() -> None:
    repository = SqlAlchemyGalleryPhotoRepository(cast(AsyncSession, FakeSession()))

    with pytest.raises(GalleryPhotoNotFoundError):
        await repository.update(make_photo())
    with pytest.raises(GalleryPhotoNotFoundError):
        await repository.delete(PHOTO_ID)


@pytest.mark.asyncio
async def test_get_delete_and_list_gallery_photos() -> None:
    record = make_record()
    session = FakeSession(records={PHOTO_ID: record}, query_result=[record])
    repository = SqlAlchemyGalleryPhotoRepository(cast(AsyncSession, session))

    found = await repository.get_by_id(PHOTO_ID)
    page = await repository.list_ready_page(
        limit=12,
        after=(Decimal("1"), UUID(int=1)),
        tag="striping",
    )
    all_photos = await repository.list_all()
    await repository.delete(PHOTO_ID)

    assert found is not None and found.id == PHOTO_ID
    assert page[0].title == "Downtown deck"
    assert all_photos[0].status is GalleryPhotoStatus.READY
    assert session.deleted == [record]


@pytest.mark.asyncio
async def test_max_sort_key_handles_value_and_empty_result() -> None:
    with_value = SqlAlchemyGalleryPhotoRepository(
        cast(AsyncSession, FakeSession(query_result=Decimal("4096")))
    )
    empty = SqlAlchemyGalleryPhotoRepository(cast(AsyncSession, FakeSession()))

    assert await with_value.max_sort_key() == Decimal("4096")
    assert await empty.max_sort_key() is None
