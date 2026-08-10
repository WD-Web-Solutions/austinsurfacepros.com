from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

import pytest

from austin_surface_pros_api.domain.gallery import (
    GalleryPhoto,
    GalleryPhotoNotFoundError,
    GalleryPhotoStatus,
    InvalidGalleryPhotoError,
)
from austin_surface_pros_api.services.gallery import GalleryService, InvalidGalleryCursorError
from tests.conftest import FakeGalleryObjectStorage, InMemoryGalleryPhotoRepository

UPLOADER_ID = UUID("11111111-1111-1111-1111-111111111111")


def make_photo(photo_id: int, sort_key: str, *, status: GalleryPhotoStatus) -> GalleryPhoto:
    now = datetime(2026, 8, 10, 12, 0, tzinfo=UTC)
    return GalleryPhoto(
        id=UUID(int=photo_id),
        title=f"Project {photo_id}",
        alt_text=f"Finished project {photo_id}",
        description="A finished surface project.",
        tags=("asphalt",),
        city="Austin",
        state="Texas",
        captured_at=None,
        crop_aspect="4:3",
        crop_x=50,
        crop_y=50,
        crop_zoom=1,
        staging_key=None,
        image_key=f"gallery-media/processed/{photo_id}/display.webp",
        thumbnail_key=f"gallery-media/processed/{photo_id}/thumbnail.webp",
        width=1600,
        height=1200,
        sort_key=Decimal(sort_key),
        status=status,
        uploader_id=UPLOADER_ID,
        created_at=now,
        updated_at=now,
        published_at=now if status is GalleryPhotoStatus.READY else None,
    )


@pytest.mark.asyncio
async def test_begin_and_complete_upload_publishes_only_processed_keys() -> None:
    repository = InMemoryGalleryPhotoRepository()
    storage = FakeGalleryObjectStorage()
    service = GalleryService(repository, storage)

    pending, upload = await service.begin_upload(
        uploader_id=UPLOADER_ID,
        content_type="image/jpeg",
        content_length=1024,
        title="  Downtown deck refresh ",
        alt_text="Fresh striping on the downtown parking deck",
        description="Completed overnight.",
        tags=["#Striping", " striping ", "Night Work"],
        city="Austin",
        state="Texas",
        captured_at=None,
        crop_aspect="16:9",
        crop_x=50,
        crop_y=45,
        crop_zoom=1.2,
    )

    assert pending.status is GalleryPhotoStatus.UPLOADING
    assert pending.image_key is None
    assert pending.tags == ("striping", "night-work")
    assert upload.url.startswith("https://uploads.example.test/")

    ready = await service.complete_upload(pending.id)

    assert ready.status is GalleryPhotoStatus.READY
    assert ready.staging_key is None
    assert ready.image_key is not None and ready.image_key.endswith("display.webp")
    assert ready.published_at is not None


@pytest.mark.asyncio
async def test_public_gallery_uses_cursor_pagination_and_excludes_pending() -> None:
    repository = InMemoryGalleryPhotoRepository()
    repository.photos.extend(
        [
            make_photo(1, "1024", status=GalleryPhotoStatus.READY),
            make_photo(2, "2048", status=GalleryPhotoStatus.READY),
            make_photo(3, "3072", status=GalleryPhotoStatus.READY),
            make_photo(4, "4096", status=GalleryPhotoStatus.UPLOADING),
        ]
    )
    service = GalleryService(repository, FakeGalleryObjectStorage())

    first = await service.list_public(limit=2)
    second = await service.list_public(limit=2, cursor=first.next_cursor)

    assert [photo.id.int for photo in first.photos] == [1, 2]
    assert first.next_cursor is not None
    assert [photo.id.int for photo in second.photos] == [3]
    assert second.next_cursor is None


@pytest.mark.asyncio
async def test_reorder_between_neighbors_updates_only_moved_photo() -> None:
    repository = InMemoryGalleryPhotoRepository()
    repository.photos.extend(
        [
            make_photo(1, "1024", status=GalleryPhotoStatus.READY),
            make_photo(2, "2048", status=GalleryPhotoStatus.READY),
            make_photo(3, "3072", status=GalleryPhotoStatus.READY),
        ]
    )
    service = GalleryService(repository, FakeGalleryObjectStorage())

    moved = await service.reorder(
        UUID(int=3),
        previous_id=UUID(int=1),
        next_id=UUID(int=2),
    )

    assert moved.sort_key == Decimal("1536")
    assert repository.update_count == 1


@pytest.mark.asyncio
async def test_reorder_without_neighbors_supports_a_single_photo() -> None:
    repository = InMemoryGalleryPhotoRepository()
    repository.photos.append(make_photo(1, "2048", status=GalleryPhotoStatus.READY))
    service = GalleryService(repository, FakeGalleryObjectStorage())

    moved = await service.reorder(
        UUID(int=1),
        previous_id=None,
        next_id=None,
    )

    assert moved.sort_key == Decimal("1024")
    assert repository.update_count == 1


@pytest.mark.asyncio
async def test_update_list_and_delete_gallery_photo() -> None:
    repository = InMemoryGalleryPhotoRepository()
    repository.photos.append(make_photo(1, "1024", status=GalleryPhotoStatus.READY))
    storage = FakeGalleryObjectStorage()
    service = GalleryService(repository, storage)

    updated = await service.update_metadata(
        UUID(int=1),
        title="Updated project",
        alt_text="Updated description of the completed surface",
        description="A revised caption.",
        tags=["#Concrete"],
        city=" Cedar Park ",
        state="Texas",
    )
    listed = await service.list_admin()
    await service.delete(UUID(int=1))

    assert updated.tags == ("concrete",)
    assert updated.city == "Cedar Park"
    assert listed == (updated,)
    assert storage.deleted[0][0].endswith("display.webp")
    assert repository.photos == []


@pytest.mark.asyncio
async def test_invalid_cursor_metadata_and_missing_photo_are_rejected() -> None:
    service = GalleryService(InMemoryGalleryPhotoRepository(), FakeGalleryObjectStorage())

    with pytest.raises(InvalidGalleryCursorError):
        await service.list_public(limit=12, cursor="not-a-cursor")
    with pytest.raises(GalleryPhotoNotFoundError):
        await service.delete(UUID(int=99))
    with pytest.raises(InvalidGalleryPhotoError, match="Title"):
        await service.begin_upload(
            uploader_id=UPLOADER_ID,
            content_type="image/jpeg",
            content_length=1024,
            title=" ",
            alt_text="A useful description",
            description="",
            tags=[],
            city=None,
            state=None,
            captured_at=None,
            crop_aspect="4:3",
            crop_x=50,
            crop_y=50,
            crop_zoom=1,
        )
