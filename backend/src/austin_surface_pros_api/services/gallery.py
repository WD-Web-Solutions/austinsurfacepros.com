import base64
import json
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from uuid import UUID, uuid4

from loguru import logger

from austin_surface_pros_api.core.gallery_storage import (
    ALLOWED_GALLERY_CONTENT_TYPES,
    MAX_GALLERY_UPLOAD_BYTES,
)
from austin_surface_pros_api.domain.gallery import (
    GalleryPage,
    GalleryPhoto,
    GalleryPhotoNotFoundError,
    GalleryPhotoRepository,
    GalleryPhotoStatus,
    InvalidGalleryPhotoError,
    normalize_gallery_tags,
)
from austin_surface_pros_api.domain.gallery_storage import (
    GalleryObjectStorage,
    InvalidGalleryImageError,
    PresignedGalleryUpload,
)

SORT_KEY_STEP = Decimal("1024")
MIN_SORT_KEY_GAP = Decimal("0.000001")
ALLOWED_CROP_ASPECTS = frozenset({"original", "1:1", "4:3", "16:9", "4:5"})


class InvalidGalleryCursorError(ValueError):
    """Raised when a public gallery cursor cannot be decoded."""


class GalleryService:
    def __init__(
        self,
        repository: GalleryPhotoRepository,
        storage: GalleryObjectStorage,
    ) -> None:
        self._repository = repository
        self._storage = storage

    async def list_public(
        self,
        *,
        limit: int,
        cursor: str | None = None,
        tag: str | None = None,
    ) -> GalleryPage:
        bounded_limit = min(max(limit, 1), 40)
        after = self._decode_cursor(cursor) if cursor else None
        normalized_tags = normalize_gallery_tags([tag]) if tag else ()
        normalized_tag = normalized_tags[0] if normalized_tags else None
        photos = await self._repository.list_ready_page(
            limit=bounded_limit + 1,
            after=after,
            tag=normalized_tag,
        )
        has_more = len(photos) > bounded_limit
        visible = photos[:bounded_limit]
        next_cursor = self._encode_cursor(visible[-1]) if has_more and visible else None
        return GalleryPage(photos=tuple(visible), next_cursor=next_cursor)

    async def list_admin(self) -> tuple[GalleryPhoto, ...]:
        return tuple(await self._repository.list_all())

    async def begin_upload(
        self,
        *,
        uploader_id: UUID,
        content_type: str,
        content_length: int,
        title: str,
        alt_text: str,
        description: str,
        tags: list[str],
        city: str | None,
        state: str | None,
        captured_at: datetime | None,
        crop_aspect: str,
        crop_x: float,
        crop_y: float,
        crop_zoom: float,
    ) -> tuple[GalleryPhoto, PresignedGalleryUpload]:
        if content_type not in ALLOWED_GALLERY_CONTENT_TYPES:
            raise InvalidGalleryImageError("Only JPEG, PNG, and WebP photos are supported")
        if content_length <= 0 or content_length > MAX_GALLERY_UPLOAD_BYTES:
            raise InvalidGalleryImageError("Photo must be no larger than 15 MB")

        metadata = self._validated_metadata(
            title=title,
            alt_text=alt_text,
            description=description,
            tags=tags,
            city=city,
            state=state,
            captured_at=captured_at,
            crop_aspect=crop_aspect,
            crop_x=crop_x,
            crop_y=crop_y,
            crop_zoom=crop_zoom,
        )
        now = datetime.now(UTC)
        photo_id = uuid4()
        upload = await self._storage.create_upload(
            photo_id=photo_id,
            content_type=content_type,
        )
        maximum = await self._repository.max_sort_key()
        photo = GalleryPhoto(
            id=photo_id,
            **metadata,
            staging_key=upload.key,
            image_key=None,
            thumbnail_key=None,
            width=None,
            height=None,
            sort_key=(maximum or Decimal("0")) + SORT_KEY_STEP,
            status=GalleryPhotoStatus.UPLOADING,
            uploader_id=uploader_id,
            created_at=now,
            updated_at=now,
            published_at=None,
        )
        return await self._repository.add(photo), upload

    async def complete_upload(self, photo_id: UUID) -> GalleryPhoto:
        photo = await self._required_photo(photo_id)
        if photo.status is GalleryPhotoStatus.READY:
            return photo
        if photo.staging_key is None:
            raise InvalidGalleryImageError("This upload no longer has staged image data")

        try:
            processed = await self._storage.process_upload(
                photo_id=photo.id,
                staging_key=photo.staging_key,
            )
        except Exception as error:
            if isinstance(error, InvalidGalleryImageError):
                failed = photo.with_changes(
                    status=GalleryPhotoStatus.FAILED,
                    updated_at=datetime.now(UTC),
                )
                await self._repository.update(failed)
            logger.warning(
                "Gallery photo processing failed for {}: {}",
                photo_id,
                type(error).__name__,
            )
            raise

        now = datetime.now(UTC)
        ready = photo.with_changes(
            staging_key=None,
            image_key=processed.image_key,
            thumbnail_key=processed.thumbnail_key,
            width=processed.width,
            height=processed.height,
            status=GalleryPhotoStatus.READY,
            updated_at=now,
            published_at=now,
        )
        return await self._repository.update(ready)

    async def update_metadata(
        self,
        photo_id: UUID,
        *,
        title: str,
        alt_text: str,
        description: str,
        tags: list[str],
        city: str | None,
        state: str | None,
    ) -> GalleryPhoto:
        photo = await self._required_photo(photo_id)
        metadata = self._validated_metadata(
            title=title,
            alt_text=alt_text,
            description=description,
            tags=tags,
            city=city,
            state=state,
            captured_at=photo.captured_at,
            crop_aspect=photo.crop_aspect,
            crop_x=photo.crop_x,
            crop_y=photo.crop_y,
            crop_zoom=photo.crop_zoom,
        )
        return await self._repository.update(
            photo.with_changes(**metadata, updated_at=datetime.now(UTC))
        )

    async def reorder(
        self,
        photo_id: UUID,
        *,
        previous_id: UUID | None,
        next_id: UUID | None,
    ) -> GalleryPhoto:
        photo = await self._required_photo(photo_id)
        duplicate_neighbors = (
            previous_id is not None
            and next_id is not None
            and previous_id == next_id
        )
        if previous_id == photo_id or next_id == photo_id or duplicate_neighbors:
            raise InvalidGalleryPhotoError("Reorder neighbors must be distinct photos")

        previous = await self._required_photo(previous_id) if previous_id else None
        following = await self._required_photo(next_id) if next_id else None
        if previous and following and previous.sort_key >= following.sort_key:
            raise InvalidGalleryPhotoError("Reorder neighbors are not in display order")

        next_sort_key = self._between(previous, following)
        if self._needs_rebalance(previous, following, next_sort_key):
            await self._rebalance()
            previous = await self._required_photo(previous_id) if previous_id else None
            following = await self._required_photo(next_id) if next_id else None
            next_sort_key = self._between(previous, following)

        return await self._repository.update(
            photo.with_changes(sort_key=next_sort_key, updated_at=datetime.now(UTC))
        )

    async def delete(self, photo_id: UUID) -> None:
        photo = await self._required_photo(photo_id)
        keys = tuple(
            key
            for key in (photo.staging_key, photo.image_key, photo.thumbnail_key)
            if key is not None
        )
        await self._storage.delete_objects(keys)
        await self._repository.delete(photo_id)

    async def _required_photo(self, photo_id: UUID | None) -> GalleryPhoto:
        if photo_id is None:
            raise GalleryPhotoNotFoundError
        photo = await self._repository.get_by_id(photo_id)
        if photo is None:
            raise GalleryPhotoNotFoundError
        return photo

    @staticmethod
    def _validated_metadata(
        *,
        title: str,
        alt_text: str,
        description: str,
        tags: list[str],
        city: str | None,
        state: str | None,
        captured_at: datetime | None,
        crop_aspect: str,
        crop_x: float,
        crop_y: float,
        crop_zoom: float,
    ) -> dict[str, object]:
        clean_title = " ".join(title.split())
        clean_alt = " ".join(alt_text.split())
        clean_description = " ".join(description.split())
        if not clean_title or len(clean_title) > 160:
            raise InvalidGalleryPhotoError("Title is required and must be 160 characters or fewer")
        if not clean_alt or len(clean_alt) > 300:
            raise InvalidGalleryPhotoError(
                "Alternative text is required and must be 300 characters or fewer"
            )
        if len(clean_description) > 1000:
            raise InvalidGalleryPhotoError("Description must be 1,000 characters or fewer")
        if crop_aspect not in ALLOWED_CROP_ASPECTS:
            raise InvalidGalleryPhotoError("Unsupported crop aspect")
        if not (0 <= crop_x <= 100 and 0 <= crop_y <= 100 and 1 <= crop_zoom <= 4):
            raise InvalidGalleryPhotoError("Crop position or zoom is outside the allowed range")

        return {
            "title": clean_title,
            "alt_text": clean_alt,
            "description": clean_description,
            "tags": normalize_gallery_tags(tags),
            "city": GalleryService._clean_optional(city, 120),
            "state": GalleryService._clean_optional(state, 120),
            "captured_at": captured_at,
            "crop_aspect": crop_aspect,
            "crop_x": crop_x,
            "crop_y": crop_y,
            "crop_zoom": crop_zoom,
        }

    @staticmethod
    def _clean_optional(value: str | None, maximum: int) -> str | None:
        if value is None:
            return None
        cleaned = " ".join(value.split())
        if len(cleaned) > maximum:
            raise InvalidGalleryPhotoError(f"Location fields must be {maximum} characters or fewer")
        return cleaned or None

    @staticmethod
    def _between(previous: GalleryPhoto | None, following: GalleryPhoto | None) -> Decimal:
        if previous and following:
            return (previous.sort_key + following.sort_key) / 2
        if previous:
            return previous.sort_key + SORT_KEY_STEP
        if following:
            return following.sort_key - SORT_KEY_STEP
        return SORT_KEY_STEP

    @staticmethod
    def _needs_rebalance(
        previous: GalleryPhoto | None,
        following: GalleryPhoto | None,
        proposed: Decimal,
    ) -> bool:
        return bool(
            (previous and abs(proposed - previous.sort_key) < MIN_SORT_KEY_GAP)
            or (following and abs(following.sort_key - proposed) < MIN_SORT_KEY_GAP)
        )

    async def _rebalance(self) -> None:
        photos = await self._repository.list_all()
        now = datetime.now(UTC)
        for index, photo in enumerate(photos, start=1):
            target = SORT_KEY_STEP * index
            if photo.sort_key != target:
                await self._repository.update(photo.with_changes(sort_key=target, updated_at=now))

    @staticmethod
    def _encode_cursor(photo: GalleryPhoto) -> str:
        payload = json.dumps([str(photo.sort_key), str(photo.id)], separators=(",", ":"))
        return base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")

    @staticmethod
    def _decode_cursor(cursor: str) -> tuple[Decimal, UUID]:
        try:
            padded = cursor + "=" * (-len(cursor) % 4)
            value = json.loads(base64.urlsafe_b64decode(padded.encode()))
            if not isinstance(value, list) or len(value) != 2:
                raise ValueError
            return Decimal(value[0]), UUID(value[1])
        except (ValueError, TypeError, json.JSONDecodeError, InvalidOperation) as error:
            raise InvalidGalleryCursorError("Invalid gallery cursor") from error
