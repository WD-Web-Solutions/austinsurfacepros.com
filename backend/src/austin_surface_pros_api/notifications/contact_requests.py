import asyncio
from html import escape
from typing import Any, Protocol

from austin_surface_pros_api.domain.contacts import ContactRequest


class ContactRequestNotifier(Protocol):
    async def notify(self, contact_request: ContactRequest) -> None: ...


class NoOpContactRequestNotifier:
    async def notify(self, contact_request: ContactRequest) -> None:
        del contact_request


class SesV2Client(Protocol):
    def send_email(self, **kwargs: Any) -> Any: ...


class SesContactRequestNotifier:
    def __init__(
        self,
        client: SesV2Client,
        source_email: str,
        recipient_emails: tuple[str, ...],
    ) -> None:
        self._client = client
        self._source_email = source_email
        self._recipient_emails = recipient_emails

    async def notify(self, contact_request: ContactRequest) -> None:
        await asyncio.to_thread(self._send, contact_request)

    def _send(self, contact_request: ContactRequest) -> None:
        subject = f"New Austin Surface Pros estimate request: {contact_request.service}"
        text_body = "\n".join(
            (
                f"Name: {contact_request.name}",
                f"Email: {contact_request.email_address}",
                f"Company: {contact_request.company or '-'}",
                f"Phone: {contact_request.phone or '-'}",
                f"Service: {contact_request.service}",
                "",
                contact_request.message,
            )
        )
        html_body = (
            "<h1>New estimate request</h1>"
            f"<p><strong>Name:</strong> {escape(contact_request.name)}</p>"
            f"<p><strong>Email:</strong> {escape(contact_request.email_address)}</p>"
            f"<p><strong>Company:</strong> {escape(contact_request.company or '-')}</p>"
            f"<p><strong>Phone:</strong> {escape(contact_request.phone or '-')}</p>"
            f"<p><strong>Service:</strong> {escape(contact_request.service)}</p>"
            f"<p>{escape(contact_request.message).replace(chr(10), '<br>')}</p>"
        )
        self._client.send_email(
            FromEmailAddress=self._source_email,
            Destination={"ToAddresses": list(self._recipient_emails)},
            Content={
                "Simple": {
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {
                        "Text": {"Data": text_body, "Charset": "UTF-8"},
                        "Html": {"Data": html_body, "Charset": "UTF-8"},
                    },
                }
            },
        )
