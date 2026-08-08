from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from austin_surface_pros_api.db.database import Database, DatabaseNotConfiguredError
from austin_surface_pros_api.db.repositories import SqlAlchemyContactRequestRepository
from austin_surface_pros_api.notifications.contact_requests import ContactRequestNotifier
from austin_surface_pros_api.services.contact_requests import ContactRequestService


def get_database(request: Request) -> Database:
    return request.app.state.database


def get_contact_request_notifier(request: Request) -> ContactRequestNotifier:
    return request.app.state.contact_request_notifier


async def get_session(
    database: Annotated[Database, Depends(get_database)],
) -> AsyncIterator[AsyncSession]:
    try:
        async with database.session() as session:
            yield session
    except DatabaseNotConfiguredError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured",
        ) from error


def get_contact_request_service(
    session: Annotated[AsyncSession, Depends(get_session)],
    notifier: Annotated[ContactRequestNotifier, Depends(get_contact_request_notifier)],
) -> ContactRequestService:
    repository = SqlAlchemyContactRequestRepository(session)
    return ContactRequestService(repository, notifier=notifier)
