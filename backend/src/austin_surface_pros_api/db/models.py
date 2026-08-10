from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class UserRecord(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True)
    email_address: Mapped[str] = mapped_column(String(254), unique=True)
    full_name: Mapped[str] = mapped_column(String(200))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AccountNoteRecord(Base):
    __tablename__ = "account_notes"

    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    author_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id"))
    author_name: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class BlogPostRecord(Base):
    __tablename__ = "blog_posts"

    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(220), unique=True)
    excerpt: Mapped[str] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(Text)
    cover_image_url: Mapped[str | None] = mapped_column(String(500))
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(60)))
    author_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id"))
    author_name: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="draft")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class CommentRecord(Base):
    __tablename__ = "comments"

    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True)
    post_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True), ForeignKey("blog_posts.id"), index=True
    )
    author_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id"))
    author_name: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class TagSubscriptionRecord(Base):
    __tablename__ = "tag_subscriptions"
    __table_args__ = (
        UniqueConstraint("user_id", "tag_name", name="uq_tag_subscriptions_user_tag"),
    )

    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    tag_name: Mapped[str] = mapped_column(String(60))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class ContactRequestRecord(Base):
    __tablename__ = "contact_requests"

    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    email_address: Mapped[str | None] = mapped_column(String(254))
    company: Mapped[str | None] = mapped_column(String(200))
    phone: Mapped[str | None] = mapped_column(String(40))
    property_type: Mapped[str] = mapped_column(String(120))
    service: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    address_line: Mapped[str] = mapped_column(String(240))
    city: Mapped[str] = mapped_column(String(120))
    state: Mapped[str] = mapped_column(String(60))
    postal_code: Mapped[str] = mapped_column(String(10))
    timeline: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(40), default="received")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class GalleryPhotoRecord(Base):
    __tablename__ = "gallery_photos"
    __table_args__ = (Index("ix_gallery_photos_public_order", "status", "sort_key", "id"),)

    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    alt_text: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(String(1000), default="")
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(60)))
    city: Mapped[str | None] = mapped_column(String(120))
    state: Mapped[str | None] = mapped_column(String(120))
    captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    crop_aspect: Mapped[str] = mapped_column(String(20))
    crop_x: Mapped[float] = mapped_column(Numeric(6, 3))
    crop_y: Mapped[float] = mapped_column(Numeric(6, 3))
    crop_zoom: Mapped[float] = mapped_column(Numeric(6, 3))
    staging_key: Mapped[str | None] = mapped_column(String(500))
    image_key: Mapped[str | None] = mapped_column(String(500), unique=True)
    thumbnail_key: Mapped[str | None] = mapped_column(String(500), unique=True)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    sort_key: Mapped[float] = mapped_column(Numeric(30, 12))
    status: Mapped[str] = mapped_column(String(20))
    uploader_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
