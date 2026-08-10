from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
from pydantic.alias_generators import to_camel

from austin_surface_pros_api.api.dependencies import get_contact_request_service
from austin_surface_pros_api.services.contact_requests import (
    ContactRequestService,
    SubmitContactRequest,
)

router = APIRouter(prefix="/contact-requests", tags=["contact requests"])


class ContactRequestCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str = Field(min_length=1, max_length=200)
    email_address: EmailStr | None = None
    company: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=40)
    property_type: str = Field(min_length=1, max_length=120)
    service: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=4000)
    address_line: str = Field(min_length=1, max_length=240)
    city: str = Field(min_length=1, max_length=120)
    state: str = Field(min_length=1, max_length=60)
    postal_code: str = Field(pattern=r"^\d{5}(?:-\d{4})?$")
    timeline: str = Field(min_length=1, max_length=120)

    @model_validator(mode="after")
    def require_contact_method(self) -> ContactRequestCreate:
        if self.email_address is None and not (self.phone or "").strip():
            raise ValueError("Provide an email address, a phone number, or both")
        return self


class ContactRequestAccepted(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: UUID
    status: str


@router.post(
    "",
    response_model=ContactRequestAccepted,
    response_model_by_alias=True,
    status_code=status.HTTP_202_ACCEPTED,
)
async def submit_contact_request(
    payload: ContactRequestCreate,
    service: Annotated[ContactRequestService, Depends(get_contact_request_service)],
) -> ContactRequestAccepted:
    contact_request = await service.submit(
        SubmitContactRequest(
            name=payload.name,
            email_address=str(payload.email_address) if payload.email_address else None,
            company=payload.company,
            phone=payload.phone,
            property_type=payload.property_type,
            service=payload.service,
            message=payload.message,
            address_line=payload.address_line,
            city=payload.city,
            state=payload.state,
            postal_code=payload.postal_code,
            timeline=payload.timeline,
        )
    )
    return ContactRequestAccepted(id=contact_request.id, status=contact_request.status.value)
