from io import BytesIO
from typing import Any
from uuid import UUID

from anyio import to_thread
from PIL import Image, ImageOps, UnidentifiedImageError

from austin_surface_pros_api.domain.gallery_storage import (
    GalleryObjectStorage,
    GalleryStorageUnavailableError,
    GalleryUploadNotFoundError,
    InvalidGalleryImageError,
    PresignedGalleryUpload,
    ProcessedGalleryImage,
)

MAX_GALLERY_UPLOAD_BYTES = 15 * 1024 * 1024
MAX_GALLERY_PIXELS = 25_000_000
MIN_GALLERY_EDGE = 320
ALLOWED_GALLERY_CONTENT_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
ALLOWED_GALLERY_FORMATS = frozenset({"JPEG", "PNG", "WEBP"})


class UnavailableGalleryObjectStorage(GalleryObjectStorage):
    async def create_upload(
        self,
        *,
        photo_id: UUID,
        content_type: str,
    ) -> PresignedGalleryUpload:
        del photo_id, content_type
        raise GalleryStorageUnavailableError

    async def process_upload(
        self,
        *,
        photo_id: UUID,
        staging_key: str,
    ) -> ProcessedGalleryImage:
        del photo_id, staging_key
        raise GalleryStorageUnavailableError

    async def delete_objects(self, keys: tuple[str, ...]) -> None:
        del keys


class S3GalleryObjectStorage(GalleryObjectStorage):
    def __init__(self, client: Any, bucket_name: str, expires_in_seconds: int = 300) -> None:
        self._client = client
        self._bucket_name = bucket_name
        self._expires_in_seconds = expires_in_seconds

    async def create_upload(
        self,
        *,
        photo_id: UUID,
        content_type: str,
    ) -> PresignedGalleryUpload:
        if content_type not in ALLOWED_GALLERY_CONTENT_TYPES:
            raise InvalidGalleryImageError("Only JPEG, PNG, and WebP photos are supported")

        key = f"gallery-media/staging/{photo_id}/original"
        headers = {
            "Content-Type": content_type,
            "x-amz-server-side-encryption": "AES256",
        }
        url = self._client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self._bucket_name,
                "Key": key,
                "ContentType": content_type,
                "ServerSideEncryption": "AES256",
            },
            ExpiresIn=self._expires_in_seconds,
            HttpMethod="PUT",
        )
        return PresignedGalleryUpload(
            url=url,
            key=key,
            headers=headers,
            expires_in_seconds=self._expires_in_seconds,
        )

    async def process_upload(
        self,
        *,
        photo_id: UUID,
        staging_key: str,
    ) -> ProcessedGalleryImage:
        return await to_thread.run_sync(self._process_upload_sync, photo_id, staging_key)

    def _process_upload_sync(self, photo_id: UUID, staging_key: str) -> ProcessedGalleryImage:
        try:
            response = self._client.get_object(Bucket=self._bucket_name, Key=staging_key)
        except self._client.exceptions.NoSuchKey as error:
            raise GalleryUploadNotFoundError from error

        size = int(response.get("ContentLength", 0))
        if size <= 0 or size > MAX_GALLERY_UPLOAD_BYTES:
            self._delete_sync((staging_key,))
            raise InvalidGalleryImageError("Photo must be no larger than 15 MB")

        content = response["Body"].read(MAX_GALLERY_UPLOAD_BYTES + 1)
        if len(content) != size or len(content) > MAX_GALLERY_UPLOAD_BYTES:
            self._delete_sync((staging_key,))
            raise InvalidGalleryImageError("Uploaded photo size could not be validated")

        try:
            with Image.open(BytesIO(content)) as source:
                if source.format not in ALLOWED_GALLERY_FORMATS:
                    raise InvalidGalleryImageError("Photo bytes do not match a supported format")
                width, height = source.size
                if min(width, height) < MIN_GALLERY_EDGE:
                    raise InvalidGalleryImageError("Photo must be at least 320 pixels on each edge")
                if width * height > MAX_GALLERY_PIXELS:
                    raise InvalidGalleryImageError("Photo dimensions are too large")
                source.seek(0)
                normalized = ImageOps.exif_transpose(source).convert("RGB")
                normalized.load()
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
            self._delete_sync((staging_key,))
            raise InvalidGalleryImageError("Uploaded bytes are not a valid photo") from error
        except InvalidGalleryImageError:
            self._delete_sync((staging_key,))
            raise

        display = self._resize(normalized, 2400)
        thumbnail = self._resize(normalized, 900)
        image_key = f"gallery-media/processed/{photo_id}/display.webp"
        thumbnail_key = f"gallery-media/processed/{photo_id}/thumbnail.webp"
        self._put_webp(image_key, display, quality=84)
        self._put_webp(thumbnail_key, thumbnail, quality=78)
        self._delete_sync((staging_key,))
        return ProcessedGalleryImage(
            image_key=image_key,
            thumbnail_key=thumbnail_key,
            width=display.width,
            height=display.height,
        )

    @staticmethod
    def _resize(image: Image.Image, maximum_edge: int) -> Image.Image:
        result = image.copy()
        result.thumbnail((maximum_edge, maximum_edge), Image.Resampling.LANCZOS)
        return result

    def _put_webp(self, key: str, image: Image.Image, *, quality: int) -> None:
        output = BytesIO()
        image.save(output, format="WEBP", quality=quality, method=6, exif=b"")
        self._client.put_object(
            Bucket=self._bucket_name,
            Key=key,
            Body=output.getvalue(),
            ContentType="image/webp",
            CacheControl="public, max-age=31536000, immutable",
            ServerSideEncryption="AES256",
        )

    async def delete_objects(self, keys: tuple[str, ...]) -> None:
        if keys:
            await to_thread.run_sync(self._delete_sync, keys)

    def _delete_sync(self, keys: tuple[str, ...]) -> None:
        if not keys:
            return
        self._client.delete_objects(
            Bucket=self._bucket_name,
            Delete={"Objects": [{"Key": key} for key in keys], "Quiet": True},
        )
