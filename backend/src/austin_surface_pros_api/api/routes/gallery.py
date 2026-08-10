from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from austin_surface_pros_api.api.dependencies import get_gallery_service, get_settings
from austin_surface_pros_api.core.config import Settings
from austin_surface_pros_api.domain.gallery import GalleryPhoto, GalleryPhotoStatus
from austin_surface_pros_api.services.gallery import GalleryService, InvalidGalleryCursorError

router = APIRouter(prefix="/gallery", tags=["gallery"])


class GalleryPhotoResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: UUID
    title: str
    alt_text: str
    description: str
    tags: list[str]
    city: str | None
    state: str | None
    captured_at: datetime | None
    crop_aspect: str
    crop_x: float
    crop_y: float
    crop_zoom: float
    image_url: str | None
    thumbnail_url: str | None
    width: int | None
    height: int | None
    status: GalleryPhotoStatus
    created_at: datetime
    published_at: datetime | None


class GalleryPageResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[GalleryPhotoResponse]
    next_cursor: str | None


def _public_url(base_url: str, key: str | None) -> str | None:
    if key is None:
        return None
    if not base_url:
        return f"/{key.lstrip('/')}"
    return f"{base_url.rstrip('/')}/{key.lstrip('/')}"


def to_gallery_photo(photo: GalleryPhoto, settings: Settings) -> GalleryPhotoResponse:
    return GalleryPhotoResponse(
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
        image_url=_public_url(settings.gallery_public_base_url, photo.image_key),
        thumbnail_url=_public_url(settings.gallery_public_base_url, photo.thumbnail_key),
        width=photo.width,
        height=photo.height,
        status=photo.status,
        created_at=photo.created_at,
        published_at=photo.published_at,
    )


@router.get("/photos", response_model=GalleryPageResponse, response_model_by_alias=True)
async def list_gallery_photos(
    service: Annotated[GalleryService, Depends(get_gallery_service)],
    settings: Annotated[Settings, Depends(get_settings)],
    limit: Annotated[int, Query(ge=1, le=40)] = 12,
    cursor: Annotated[str | None, Query(max_length=300)] = None,
    tag: Annotated[str | None, Query(max_length=60)] = None,
) -> GalleryPageResponse:
    try:
        page = await service.list_public(limit=limit, cursor=cursor, tag=tag)
    except InvalidGalleryCursorError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid gallery cursor",
        ) from error
    return GalleryPageResponse(
        items=[to_gallery_photo(photo, settings) for photo in page.photos],
        next_cursor=page.next_cursor,
    )
