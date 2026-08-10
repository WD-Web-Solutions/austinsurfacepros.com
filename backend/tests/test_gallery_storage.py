from io import BytesIO
from uuid import UUID

import pytest
from PIL import Image

from austin_surface_pros_api.core.gallery_storage import (
    S3GalleryObjectStorage,
    UnavailableGalleryObjectStorage,
)
from austin_surface_pros_api.domain.gallery_storage import (
    GalleryStorageUnavailableError,
    InvalidGalleryImageError,
)


class FakeS3Client:
    class exceptions:
        class NoSuchKey(Exception):
            pass

    def __init__(self, content: bytes) -> None:
        self.content = content
        self.puts: list[dict] = []
        self.deletes: list[dict] = []
        self.presigns: list[tuple[tuple[object, ...], dict[str, object]]] = []

    def generate_presigned_url(self, *args: object, **kwargs: object) -> str:
        self.presigns.append((args, kwargs))
        return "https://s3.example.test/signed"

    def get_object(self, **kwargs: object) -> dict:
        del kwargs
        return {"ContentLength": len(self.content), "Body": BytesIO(self.content)}

    def put_object(self, **kwargs: object) -> None:
        self.puts.append(dict(kwargs))

    def delete_objects(self, **kwargs: object) -> None:
        self.deletes.append(dict(kwargs))


def jpeg_bytes(width: int = 1200, height: int = 800) -> bytes:
    output = BytesIO()
    Image.new("RGB", (width, height), "#d7df77").save(output, "JPEG", quality=90)
    return output.getvalue()


@pytest.mark.asyncio
async def test_s3_processor_validates_and_creates_metadata_free_webp_variants() -> None:
    client = FakeS3Client(jpeg_bytes())
    storage = S3GalleryObjectStorage(client, "private-gallery")

    result = await storage.process_upload(
        photo_id=UUID(int=1),
        staging_key="gallery-media/staging/1/original",
    )

    assert result.width == 1200
    assert result.height == 800
    assert len(client.puts) == 2
    assert all(item["ContentType"] == "image/webp" for item in client.puts)
    assert all(item["ServerSideEncryption"] == "AES256" for item in client.puts)
    with Image.open(BytesIO(client.puts[0]["Body"])) as processed:
        assert processed.format == "WEBP"
        assert processed.getexif() == {}
    assert client.deletes[0]["Delete"]["Objects"][0]["Key"].endswith("original")


@pytest.mark.asyncio
async def test_s3_processor_rejects_non_image_bytes_and_cleans_staging() -> None:
    client = FakeS3Client(b"this is not an image")
    storage = S3GalleryObjectStorage(client, "private-gallery")

    with pytest.raises(InvalidGalleryImageError):
        await storage.process_upload(
            photo_id=UUID(int=1),
            staging_key="gallery-media/staging/1/original",
        )

    assert client.puts == []
    assert len(client.deletes) == 1


@pytest.mark.asyncio
async def test_presign_limits_headers_prefix_and_expiration() -> None:
    client = FakeS3Client(jpeg_bytes())
    storage = S3GalleryObjectStorage(client, "private-gallery", expires_in_seconds=180)

    upload = await storage.create_upload(photo_id=UUID(int=4), content_type="image/jpeg")

    assert upload.expires_in_seconds == 180
    assert upload.key == "gallery-media/staging/00000000-0000-0000-0000-000000000004/original"
    assert upload.headers["x-amz-server-side-encryption"] == "AES256"
    parameters = client.presigns[0][1]["Params"]
    assert isinstance(parameters, dict)
    assert parameters["Bucket"] == "private-gallery"

    with pytest.raises(InvalidGalleryImageError):
        await storage.create_upload(photo_id=UUID(int=4), content_type="image/gif")


@pytest.mark.asyncio
async def test_unavailable_storage_fails_closed() -> None:
    storage = UnavailableGalleryObjectStorage()

    with pytest.raises(GalleryStorageUnavailableError):
        await storage.create_upload(photo_id=UUID(int=1), content_type="image/jpeg")
    with pytest.raises(GalleryStorageUnavailableError):
        await storage.process_upload(photo_id=UUID(int=1), staging_key="staging")
    await storage.delete_objects(("ignored",))
