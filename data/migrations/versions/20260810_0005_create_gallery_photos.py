"""create gallery photo metadata

Revision ID: 20260810_0005
Revises: 20260809_0004
Create Date: 2026-08-10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260810_0005"
down_revision: str | None = "20260809_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "gallery_photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("alt_text", sa.String(300), nullable=False),
        sa.Column("description", sa.String(1000), nullable=False, server_default=""),
        sa.Column("tags", postgresql.ARRAY(sa.String(60)), nullable=False),
        sa.Column("city", sa.String(120), nullable=True),
        sa.Column("state", sa.String(120), nullable=True),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("crop_aspect", sa.String(20), nullable=False),
        sa.Column("crop_x", sa.Numeric(6, 3), nullable=False),
        sa.Column("crop_y", sa.Numeric(6, 3), nullable=False),
        sa.Column("crop_zoom", sa.Numeric(6, 3), nullable=False),
        sa.Column("staging_key", sa.String(500), nullable=True),
        sa.Column("image_key", sa.String(500), nullable=True, unique=True),
        sa.Column("thumbnail_key", sa.String(500), nullable=True, unique=True),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("sort_key", sa.Numeric(30, 12), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("uploader_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["uploader_id"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index(
        "ix_gallery_photos_public_order",
        "gallery_photos",
        ["status", "sort_key", "id"],
    )


def downgrade() -> None:
    op.drop_index("ix_gallery_photos_public_order", table_name="gallery_photos")
    op.drop_table("gallery_photos")
