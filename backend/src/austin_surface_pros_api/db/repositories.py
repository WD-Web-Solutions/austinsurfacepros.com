from sqlalchemy.ext.asyncio import AsyncSession

from austin_surface_pros_api.db.models import ContactRequestRecord
from austin_surface_pros_api.domain.contacts import ContactRequest


class SqlAlchemyContactRequestRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, contact_request: ContactRequest) -> ContactRequest:
        self._session.add(
            ContactRequestRecord(
                id=contact_request.id,
                name=contact_request.name,
                email_address=contact_request.email_address,
                company=contact_request.company,
                phone=contact_request.phone,
                service=contact_request.service,
                message=contact_request.message,
                status=contact_request.status.value,
                created_at=contact_request.created_at,
            )
        )
        await self._session.flush()
        return contact_request
