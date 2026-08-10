from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from austin_surface_pros_api.api.dependencies import (
    get_gallery_service,
    get_settings,
    require_admin,
)
from austin_surface_pros_api.api.routes.gallery import GalleryPhotoResponse, to_gallery_photo
from austin_surface_pros_api.core.config import Settings
from austin_surface_pros_api.domain.gallery import (
    GalleryPhotoNotFoundError,
    InvalidGalleryPhotoError,
)
from austin_surface_pros_api.domain.gallery_storage import (
    GalleryStorageUnavailableError,
    GalleryUploadNotFoundError,
    InvalidGalleryImageError,
)
from austin_surface_pros_api.domain.users import AuthenticatedUser
from austin_surface_pros_api.services.gallery import GalleryService

router = APIRouter(
    prefix="/admin/gallery",
    tags=["admin gallery"],
    dependencies=[Depends(require_admin)],
)


class GalleryUploadRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    content_type: str = Field(max_length=100)
    content_length: int = Field(gt=0, le=15 * 1024 * 1024)
    title: str = Field(min_length=1, max_length=160)
    alt_text: str = Field(min_length=1, max_length=300)
    description: str = Field(default="", max_length=1000)
    tags: list[str] = Field(default_factory=list, max_length=12)
    city: str | None = Field(default=None, max_length=120)
    state: str | None = Field(default=None, max_length=120)
    captured_at: datetime | None = None
    crop_aspect: str
    crop_x: float = Field(ge=0, le=100)
    crop_y: float = Field(ge=0, le=100)
    crop_zoom: float = Field(ge=1, le=4)


class GalleryMetadataRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    title: str = Field(min_length=1, max_length=160)
    alt_text: str = Field(min_length=1, max_length=300)
    description: str = Field(default="", max_length=1000)
    tags: list[str] = Field(default_factory=list, max_length=12)
    city: str | None = Field(default=None, max_length=120)
    state: str | None = Field(default=None, max_length=120)


class GalleryReorderRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    previous_id: UUID | None = None
    next_id: UUID | None = None


class GalleryPresignResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    photo: GalleryPhotoResponse
    upload_url: str
    upload_headers: dict[str, str]
    expires_in_seconds: int


def _gallery_error(error: Exception) -> HTTPException:
    if isinstance(error, GalleryPhotoNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    if isinstance(error, GalleryUploadNotFoundError):
        return HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="The staged upload is missing or expired",
        )
    if isinstance(error, GalleryStorageUnavailableError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gallery object storage is not configured",
        )
    if isinstance(error, InvalidGalleryImageError):
        return HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(error),
        )
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error))


@router.get("/photos", response_model=list[GalleryPhotoResponse], response_model_by_alias=True)
async def list_admin_gallery_photos(
    service: Annotated[GalleryService, Depends(get_gallery_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> list[GalleryPhotoResponse]:
    photos = await service.list_admin()
    return [to_gallery_photo(photo, settings) for photo in photos]


@router.post(
    "/uploads/presign",
    response_model=GalleryPresignResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def create_gallery_upload(
    payload: GalleryUploadRequest,
    service: Annotated[GalleryService, Depends(get_gallery_service)],
    settings: Annotated[Settings, Depends(get_settings)],
    current_user: Annotated[AuthenticatedUser, Depends(require_admin)],
) -> GalleryPresignResponse:
    try:
        photo, upload = await service.begin_upload(
            uploader_id=current_user.id,
            **payload.model_dump(),
        )
    except (
        InvalidGalleryPhotoError,
        InvalidGalleryImageError,
        GalleryStorageUnavailableError,
    ) as error:
        raise _gallery_error(error) from error
    return GalleryPresignResponse(
        photo=to_gallery_photo(photo, settings),
        upload_url=upload.url,
        upload_headers=upload.headers,
        expires_in_seconds=upload.expires_in_seconds,
    )


@router.post(
    "/photos/{photo_id}/complete",
    response_model=GalleryPhotoResponse,
    response_model_by_alias=True,
)
async def complete_gallery_upload(
    photo_id: UUID,
    service: Annotated[GalleryService, Depends(get_gallery_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> GalleryPhotoResponse:
    try:
        photo = await service.complete_upload(photo_id)
    except (
        GalleryPhotoNotFoundError,
        GalleryUploadNotFoundError,
        GalleryStorageUnavailableError,
        InvalidGalleryImageError,
    ) as error:
        raise _gallery_error(error) from error
    return to_gallery_photo(photo, settings)


@router.patch(
    "/photos/{photo_id}",
    response_model=GalleryPhotoResponse,
    response_model_by_alias=True,
)
async def update_gallery_photo(
    photo_id: UUID,
    payload: GalleryMetadataRequest,
    service: Annotated[GalleryService, Depends(get_gallery_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> GalleryPhotoResponse:
    try:
        photo = await service.update_metadata(photo_id, **payload.model_dump())
    except (GalleryPhotoNotFoundError, InvalidGalleryPhotoError) as error:
        raise _gallery_error(error) from error
    return to_gallery_photo(photo, settings)


@router.post(
    "/photos/{photo_id}/reorder",
    response_model=GalleryPhotoResponse,
    response_model_by_alias=True,
)
async def reorder_gallery_photo(
    photo_id: UUID,
    payload: GalleryReorderRequest,
    service: Annotated[GalleryService, Depends(get_gallery_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> GalleryPhotoResponse:
    try:
        photo = await service.reorder(photo_id, **payload.model_dump())
    except (GalleryPhotoNotFoundError, InvalidGalleryPhotoError) as error:
        raise _gallery_error(error) from error
    return to_gallery_photo(photo, settings)


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gallery_photo(
    photo_id: UUID,
    service: Annotated[GalleryService, Depends(get_gallery_service)],
) -> None:
    try:
        await service.delete(photo_id)
    except (GalleryPhotoNotFoundError, GalleryStorageUnavailableError) as error:
        raise _gallery_error(error) from error
