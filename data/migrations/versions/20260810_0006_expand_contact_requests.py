"""Expand contact requests for the guided estimate flow.

Revision ID: 20260810_0006
Revises: 20260810_0005
Create Date: 2026-08-10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260810_0006"
down_revision: str | None = "20260810_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "contact_requests", "email_address", existing_type=sa.String(254), nullable=True
    )
    op.add_column("contact_requests", sa.Column("property_type", sa.String(120), nullable=True))
    op.add_column("contact_requests", sa.Column("address_line", sa.String(240), nullable=True))
    op.add_column("contact_requests", sa.Column("city", sa.String(120), nullable=True))
    op.add_column("contact_requests", sa.Column("state", sa.String(60), nullable=True))
    op.add_column("contact_requests", sa.Column("postal_code", sa.String(10), nullable=True))
    op.add_column("contact_requests", sa.Column("timeline", sa.String(120), nullable=True))

    op.execute(
        "UPDATE contact_requests SET property_type = 'Not collected' "
        "WHERE property_type IS NULL"
    )
    op.execute(
        "UPDATE contact_requests SET address_line = 'Not collected' WHERE address_line IS NULL"
    )
    op.execute("UPDATE contact_requests SET city = 'Not collected' WHERE city IS NULL")
    op.execute("UPDATE contact_requests SET state = 'Not collected' WHERE state IS NULL")
    op.execute("UPDATE contact_requests SET postal_code = '00000' WHERE postal_code IS NULL")
    op.execute("UPDATE contact_requests SET timeline = 'Not collected' WHERE timeline IS NULL")

    for column in ("property_type", "address_line", "city", "state", "postal_code", "timeline"):
        op.alter_column("contact_requests", column, nullable=False)


def downgrade() -> None:
    for column in ("timeline", "postal_code", "state", "city", "address_line", "property_type"):
        op.drop_column("contact_requests", column)
    op.execute(
        "UPDATE contact_requests SET email_address = 'phone-only@invalid.local' "
        "WHERE email_address IS NULL"
    )
    op.alter_column(
        "contact_requests", "email_address", existing_type=sa.String(254), nullable=False
    )
