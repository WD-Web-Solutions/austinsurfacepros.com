from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from austin_surface_pros_api.core.config import Settings
from austin_surface_pros_api.domain.contacts import ContactRequest
from austin_surface_pros_api.main import create_app
from austin_surface_pros_api.services.contact_requests import ContactRequestService


class InMemoryContactRequestRepository:
    def __init__(self) -> None:
        self.contact_requests: list[ContactRequest] = []

    async def add(self, contact_request: ContactRequest) -> ContactRequest:
        self.contact_requests.append(contact_request)
        return contact_request


@pytest.fixture
def repository() -> InMemoryContactRequestRepository:
    return InMemoryContactRequestRepository()


@pytest.fixture
def contact_service(
    repository: InMemoryContactRequestRepository,
) -> ContactRequestService:
    return ContactRequestService(repository)


@pytest.fixture
def app(contact_service: ContactRequestService) -> FastAPI:
    settings = Settings(environment="test", cors_origins=[], database_url=None)
    return create_app(settings, contact_service_provider=lambda: contact_service)


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client
