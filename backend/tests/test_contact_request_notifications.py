from datetime import UTC, datetime
from typing import Any
from uuid import UUID

import pytest

from austin_surface_pros_api.domain.contacts import ContactRequest, ContactRequestStatus
from austin_surface_pros_api.notifications.contact_requests import SesContactRequestNotifier


class RecordingSesV2Client:
    def __init__(self) -> None:
        self.requests: list[dict[str, Any]] = []

    def send_email(self, **kwargs: Any) -> dict[str, str]:
        self.requests.append(kwargs)
        return {"MessageId": "example-message"}


@pytest.mark.asyncio
async def test_ses_notifier_builds_text_and_escaped_html_email() -> None:
    client = RecordingSesV2Client()
    notifier = SesContactRequestNotifier(
        client=client,
        source_email="no-reply@austinsurfacepros.com",
        recipient_emails=("owner@example.com",),
    )
    contact_request = ContactRequest(
        id=UUID("9a53d09a-f258-4b09-9fb3-ef6df4c2f9fd"),
        name="Taylor <Client>",
        email_address="taylor@example.com",
        company=None,
        phone=None,
        property_type="Retail or office",
        service="Parking Lot Striping",
        message="Line one\nLine two",
        address_line="100 Congress Ave",
        city="Austin",
        state="TX",
        postal_code="78701",
        timeline="Within 1-3 months",
        status=ContactRequestStatus.RECEIVED,
        created_at=datetime(2026, 8, 4, 12, 0, tzinfo=UTC),
    )

    await notifier.notify(contact_request)

    request = client.requests[0]
    assert request["FromEmailAddress"] == "no-reply@austinsurfacepros.com"
    assert request["Destination"] == {"ToAddresses": ["owner@example.com"]}
    content = request["Content"]["Simple"]
    assert "Parking Lot Striping" in content["Subject"]["Data"]
    assert "Taylor <Client>" in content["Body"]["Text"]["Data"]
    assert "Taylor &lt;Client&gt;" in content["Body"]["Html"]["Data"]
