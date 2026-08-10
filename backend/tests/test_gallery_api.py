from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from austin_surface_pros_api.domain.users import UserRole
from tests.conftest import InMemoryGalleryPhotoRepository, InMemoryUserRepository


def register(client: TestClient, email: str) -> dict:
    response = client.post(
        "/api/auth/register",
        json={"emailAddress": email, "fullName": "Gallery Admin", "password": "super-secret-1"},
    )
    assert response.status_code == 201
    return response.json()


def login(client: TestClient, email: str) -> str:
    response = client.post(
        "/api/auth/login",
        json={"emailAddress": email, "password": "super-secret-1"},
    )
    assert response.status_code == 200
    return response.json()["accessToken"]


@pytest.mark.asyncio
async def test_presign_complete_and_public_list(
    client: TestClient,
    user_repository: InMemoryUserRepository,
    gallery_photo_repository: InMemoryGalleryPhotoRepository,
) -> None:
    registered = register(client, "gallery-admin@example.com")
    await user_repository.update_role(UUID(registered["user"]["id"]), UserRole.ADMIN)
    token = login(client, "gallery-admin@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    presign = client.post(
        "/api/admin/gallery/uploads/presign",
        headers=headers,
        json={
            "contentType": "image/jpeg",
            "contentLength": 2048,
            "title": "Downtown parking deck",
            "altText": "Fresh white striping on a downtown parking deck",
            "description": "A phased overnight project.",
            "tags": ["striping", "night-work"],
            "city": "Austin",
            "state": "Texas",
            "capturedAt": None,
            "cropAspect": "16:9",
            "cropX": 50,
            "cropY": 50,
            "cropZoom": 1,
        },
    )

    assert presign.status_code == 201
    assert presign.json()["uploadHeaders"]["Content-Type"] == "image/jpeg"
    photo_id = presign.json()["photo"]["id"]
    assert gallery_photo_repository.photos[0].image_key is None

    complete = client.post(
        f"/api/admin/gallery/photos/{photo_id}/complete",
        headers=headers,
    )
    assert complete.status_code == 200
    assert complete.json()["imageUrl"].endswith("display.webp")

    public = client.get("/api/gallery/photos?limit=12")
    assert public.status_code == 200
    assert public.json()["items"][0]["id"] == photo_id

    listed = client.get("/api/admin/gallery/photos", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    updated = client.patch(
        f"/api/admin/gallery/photos/{photo_id}",
        headers=headers,
        json={
            "title": "Updated downtown deck",
            "altText": "Updated alternative text",
            "description": "Updated story.",
            "tags": ["maintenance"],
            "city": "Austin",
            "state": "Texas",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["tags"] == ["maintenance"]

    reordered = client.post(
        f"/api/admin/gallery/photos/{photo_id}/reorder",
        headers=headers,
        json={"previousId": None, "nextId": None},
    )
    assert reordered.status_code == 200

    deleted = client.delete(f"/api/admin/gallery/photos/{photo_id}", headers=headers)
    assert deleted.status_code == 204
    assert gallery_photo_repository.photos == []


def test_gallery_mutation_requires_admin(client: TestClient) -> None:
    response = client.post(
        "/api/admin/gallery/uploads/presign",
        json={
            "contentType": "image/jpeg",
            "contentLength": 2048,
            "title": "Project",
            "altText": "A completed project",
            "cropAspect": "4:3",
            "cropX": 50,
            "cropY": 50,
            "cropZoom": 1,
        },
    )

    assert response.status_code == 401
