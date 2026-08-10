import pytest
from pydantic import ValidationError

from austin_surface_pros_api.core.config import Settings


def test_production_rejects_default_jwt_secret() -> None:
    with pytest.raises(ValidationError):
        Settings(environment="production", database_url="postgresql+psycopg://x/y")


def test_production_accepts_real_jwt_secret() -> None:
    settings = Settings(
        environment="production",
        database_url="postgresql+psycopg://x/y",
        jwt_secret_key="a-real-production-secret",
    )

    assert settings.jwt_secret_key == "a-real-production-secret"


def test_gallery_storage_requires_a_bucket_name() -> None:
    with pytest.raises(ValidationError, match="gallery_bucket_name"):
        Settings(enable_gallery_storage=True)

    settings = Settings(enable_gallery_storage=True, gallery_bucket_name="private-gallery")
    assert settings.gallery_bucket_name == "private-gallery"
