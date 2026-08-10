from fastapi.testclient import TestClient

from austin_surface_pros_api.core.config import Settings
from austin_surface_pros_api.main import create_app
from tests.conftest import InMemoryContactRequestRepository


def test_health_does_not_require_database(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.1.0"}


def test_submit_contact_request(
    client: TestClient,
    repository: InMemoryContactRequestRepository,
) -> None:
    response = client.post(
        "/api/contact-requests",
        json={
            "name": "Taylor Client",
            "emailAddress": "taylor@example.com",
            "company": "Example Property Management",
            "phone": "512-555-0100",
            "propertyType": "Retail or office",
            "service": "Parking Lot Striping",
            "message": "Please provide an estimate.",
            "addressLine": "100 Congress Ave",
            "city": "Austin",
            "state": "TX",
            "postalCode": "78701",
            "timeline": "Within 1-3 months",
        },
    )

    assert response.status_code == 202
    assert response.json()["status"] == "received"
    assert len(repository.contact_requests) == 1
    assert repository.contact_requests[0].email_address == "taylor@example.com"


def test_rejects_invalid_contact_request(client: TestClient) -> None:
    response = client.post(
        "/api/contact-requests",
        json={
            "name": "Taylor Client",
            "emailAddress": "not-an-email",
            "propertyType": "Retail or office",
            "service": "Parking Lot Striping",
            "message": "Please provide an estimate.",
            "addressLine": "100 Congress Ave",
            "city": "Austin",
            "state": "TX",
            "postalCode": "78701",
            "timeline": "Within 1-3 months",
        },
    )

    assert response.status_code == 422


def test_contact_endpoint_reports_missing_database_configuration() -> None:
    app = create_app(Settings(environment="test", cors_origins=[], database_url=None))

    with TestClient(app) as client:
        response = client.post(
            "/api/contact-requests",
            json={
                "name": "Taylor Client",
                "emailAddress": "taylor@example.com",
                "propertyType": "Retail or office",
                "service": "Parking Lot Striping",
                "message": "Please provide an estimate.",
                "addressLine": "100 Congress Ave",
                "city": "Austin",
                "state": "TX",
                "postalCode": "78701",
                "timeline": "Within 1-3 months",
            },
        )

    assert response.status_code == 503
    assert response.json() == {"detail": "Database is not configured"}


def test_submit_contact_request_with_phone_instead_of_email(
    client: TestClient,
    repository: InMemoryContactRequestRepository,
) -> None:
    response = client.post(
        "/api/contact-requests",
        json={
            "name": "Taylor Client",
            "phone": "512-555-0100",
            "propertyType": "Industrial",
            "service": "Concrete Repairs",
            "message": "Repair the loading area.",
            "addressLine": "500 Industrial Blvd",
            "city": "Austin",
            "state": "TX",
            "postalCode": "78758",
            "timeline": "As soon as practical",
        },
    )

    assert response.status_code == 202
    assert repository.contact_requests[-1].email_address is None
    assert repository.contact_requests[-1].phone == "512-555-0100"
