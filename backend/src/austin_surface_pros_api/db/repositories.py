from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from austin_surface_pros_api.db.models import (
    AccountNoteRecord,
    BlogPostRecord,
    CommentRecord,
    ContactRequestRecord,
    GalleryPhotoRecord,
    TagSubscriptionRecord,
    UserRecord,
)
from austin_surface_pros_api.domain.account_notes import AccountNote
from austin_surface_pros_api.domain.blog import (
    BlogPost,
    Comment,
    CommentNotFoundError,
    PostNotFoundError,
    PostStatus,
    TagSubscription,
)
from austin_surface_pros_api.domain.contacts import ContactRequest
from austin_surface_pros_api.domain.gallery import (
    GalleryPhoto,
    GalleryPhotoNotFoundError,
    GalleryPhotoStatus,
)
from austin_surface_pros_api.domain.users import AccountStatus, User, UserNotFoundError, UserRole


def _to_domain_user(record: UserRecord) -> User:
    return User(
        id=record.id,
        email_address=record.email_address,
        full_name=record.full_name,
        hashed_password=record.hashed_password,
        role=UserRole(record.role),
        status=AccountStatus(record.status),
        created_at=record.created_at,
        last_login_at=record.last_login_at,
    )


class SqlAlchemyUserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, user: User) -> User:
        self._session.add(
            UserRecord(
                id=user.id,
                email_address=user.email_address,
                full_name=user.full_name,
                hashed_password=user.hashed_password,
                role=user.role.value,
                status=user.status.value,
                created_at=user.created_at,
                last_login_at=user.last_login_at,
            )
        )
        await self._session.flush()
        return user

    async def get_by_email(self, email_address: str) -> User | None:
        result = await self._session.execute(
            select(UserRecord).where(UserRecord.email_address == email_address)
        )
        record = result.scalar_one_or_none()
        return None if record is None else _to_domain_user(record)

    async def get_by_id(self, user_id: UUID) -> User | None:
        record = await self._session.get(UserRecord, user_id)
        return None if record is None else _to_domain_user(record)

    async def list_all(self) -> list[User]:
        result = await self._session.execute(select(UserRecord).order_by(UserRecord.created_at))
        return [_to_domain_user(record) for record in result.scalars().all()]

    async def update_role(self, user_id: UUID, role: UserRole) -> User:
        record = await self._session.get(UserRecord, user_id)
        if record is None:
            raise UserNotFoundError
        record.role = role.value
        await self._session.flush()
        return _to_domain_user(record)

    async def update_status(self, user_id: UUID, status: AccountStatus) -> User:
        record = await self._session.get(UserRecord, user_id)
        if record is None:
            raise UserNotFoundError
        record.status = status.value
        await self._session.flush()
        return _to_domain_user(record)

    async def update_last_login(self, user_id: UUID, when: datetime) -> None:
        record = await self._session.get(UserRecord, user_id)
        if record is None:
            raise UserNotFoundError
        record.last_login_at = when
        await self._session.flush()


class SqlAlchemyAccountNoteRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, note: AccountNote) -> AccountNote:
        self._session.add(
            AccountNoteRecord(
                id=note.id,
                user_id=note.user_id,
                author_id=note.author_id,
                author_name=note.author_name,
                body=note.body,
                created_at=note.created_at,
            )
        )
        await self._session.flush()
        return note

    async def list_for_user(self, user_id: UUID) -> list[AccountNote]:
        result = await self._session.execute(
            select(AccountNoteRecord)
            .where(AccountNoteRecord.user_id == user_id)
            .order_by(AccountNoteRecord.created_at.desc())
        )
        return [
            AccountNote(
                id=record.id,
                user_id=record.user_id,
                author_id=record.author_id,
                author_name=record.author_name,
                body=record.body,
                created_at=record.created_at,
            )
            for record in result.scalars().all()
        ]


def _to_domain_post(record: BlogPostRecord) -> BlogPost:
    return BlogPost(
        id=record.id,
        title=record.title,
        slug=record.slug,
        excerpt=record.excerpt,
        body=record.body,
        cover_image_url=record.cover_image_url,
        tags=tuple(record.tags),
        author_id=record.author_id,
        author_name=record.author_name,
        status=PostStatus(record.status),
        published_at=record.published_at,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


class SqlAlchemyBlogPostRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, post: BlogPost) -> BlogPost:
        self._session.add(
            BlogPostRecord(
                id=post.id,
                title=post.title,
                slug=post.slug,
                excerpt=post.excerpt,
                body=post.body,
                cover_image_url=post.cover_image_url,
                tags=list(post.tags),
                author_id=post.author_id,
                author_name=post.author_name,
                status=post.status.value,
                published_at=post.published_at,
                created_at=post.created_at,
                updated_at=post.updated_at,
            )
        )
        await self._session.flush()
        return post

    async def update(self, post: BlogPost) -> BlogPost:
        record = await self._session.get(BlogPostRecord, post.id)
        if record is None:
            raise PostNotFoundError
        record.title = post.title
        record.slug = post.slug
        record.excerpt = post.excerpt
        record.body = post.body
        record.cover_image_url = post.cover_image_url
        record.tags = list(post.tags)
        record.status = post.status.value
        record.published_at = post.published_at
        record.updated_at = post.updated_at
        await self._session.flush()
        return _to_domain_post(record)

    async def delete(self, post_id: UUID) -> None:
        record = await self._session.get(BlogPostRecord, post_id)
        if record is None:
            raise PostNotFoundError
        await self._session.delete(record)
        await self._session.flush()

    async def get_by_id(self, post_id: UUID) -> BlogPost | None:
        record = await self._session.get(BlogPostRecord, post_id)
        return None if record is None else _to_domain_post(record)

    async def get_by_slug(self, slug: str) -> BlogPost | None:
        result = await self._session.execute(
            select(BlogPostRecord).where(BlogPostRecord.slug == slug)
        )
        record = result.scalar_one_or_none()
        return None if record is None else _to_domain_post(record)

    async def slug_exists(self, slug: str) -> bool:
        result = await self._session.execute(
            select(BlogPostRecord.id).where(BlogPostRecord.slug == slug)
        )
        return result.scalar_one_or_none() is not None

    async def list_published(self, tag: str | None = None) -> list[BlogPost]:
        query = select(BlogPostRecord).where(BlogPostRecord.status == PostStatus.PUBLISHED.value)
        if tag is not None:
            query = query.where(BlogPostRecord.tags.any(tag))
        query = query.order_by(BlogPostRecord.published_at.desc())
        result = await self._session.execute(query)
        return [_to_domain_post(record) for record in result.scalars().all()]

    async def list_all(self) -> list[BlogPost]:
        result = await self._session.execute(
            select(BlogPostRecord).order_by(BlogPostRecord.created_at.desc())
        )
        return [_to_domain_post(record) for record in result.scalars().all()]

    async def list_distinct_published_tags(self) -> list[str]:
        result = await self._session.execute(
            select(BlogPostRecord.tags).where(BlogPostRecord.status == PostStatus.PUBLISHED.value)
        )
        tags: set[str] = set()
        for row in result.scalars().all():
            tags.update(row)
        return sorted(tags)


class SqlAlchemyCommentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, comment: Comment) -> Comment:
        self._session.add(
            CommentRecord(
                id=comment.id,
                post_id=comment.post_id,
                author_id=comment.author_id,
                author_name=comment.author_name,
                body=comment.body,
                created_at=comment.created_at,
            )
        )
        await self._session.flush()
        return comment

    async def get_by_id(self, comment_id: UUID) -> Comment | None:
        record = await self._session.get(CommentRecord, comment_id)
        return None if record is None else self._to_domain(record)

    async def list_for_post(self, post_id: UUID) -> list[Comment]:
        result = await self._session.execute(
            select(CommentRecord)
            .where(CommentRecord.post_id == post_id)
            .order_by(CommentRecord.created_at)
        )
        return [self._to_domain(record) for record in result.scalars().all()]

    async def delete(self, comment_id: UUID) -> None:
        record = await self._session.get(CommentRecord, comment_id)
        if record is None:
            raise CommentNotFoundError
        await self._session.delete(record)
        await self._session.flush()

    @staticmethod
    def _to_domain(record: CommentRecord) -> Comment:
        return Comment(
            id=record.id,
            post_id=record.post_id,
            author_id=record.author_id,
            author_name=record.author_name,
            body=record.body,
            created_at=record.created_at,
        )


class SqlAlchemyTagSubscriptionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, subscription: TagSubscription) -> TagSubscription:
        self._session.add(
            TagSubscriptionRecord(
                id=subscription.id,
                user_id=subscription.user_id,
                tag_name=subscription.tag_name,
                created_at=subscription.created_at,
            )
        )
        await self._session.flush()
        return subscription

    async def remove(self, user_id: UUID, tag_name: str) -> None:
        result = await self._session.execute(
            select(TagSubscriptionRecord).where(
                TagSubscriptionRecord.user_id == user_id,
                TagSubscriptionRecord.tag_name == tag_name,
            )
        )
        record = result.scalar_one_or_none()
        if record is not None:
            await self._session.delete(record)
            await self._session.flush()

    async def get(self, user_id: UUID, tag_name: str) -> TagSubscription | None:
        result = await self._session.execute(
            select(TagSubscriptionRecord).where(
                TagSubscriptionRecord.user_id == user_id,
                TagSubscriptionRecord.tag_name == tag_name,
            )
        )
        record = result.scalar_one_or_none()
        return None if record is None else self._to_domain(record)

    async def list_for_user(self, user_id: UUID) -> list[TagSubscription]:
        result = await self._session.execute(
            select(TagSubscriptionRecord)
            .where(TagSubscriptionRecord.user_id == user_id)
            .order_by(TagSubscriptionRecord.created_at)
        )
        return [self._to_domain(record) for record in result.scalars().all()]

    @staticmethod
    def _to_domain(record: TagSubscriptionRecord) -> TagSubscription:
        return TagSubscription(
            id=record.id,
            user_id=record.user_id,
            tag_name=record.tag_name,
            created_at=record.created_at,
        )


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
                property_type=contact_request.property_type,
                service=contact_request.service,
                message=contact_request.message,
                address_line=contact_request.address_line,
                city=contact_request.city,
                state=contact_request.state,
                postal_code=contact_request.postal_code,
                timeline=contact_request.timeline,
                status=contact_request.status.value,
                created_at=contact_request.created_at,
            )
        )
        await self._session.flush()
        return contact_request


def _to_domain_gallery_photo(record: GalleryPhotoRecord) -> GalleryPhoto:
    return GalleryPhoto(
        id=record.id,
        title=record.title,
        alt_text=record.alt_text,
        description=record.description,
        tags=tuple(record.tags),
        city=record.city,
        state=record.state,
        captured_at=record.captured_at,
        crop_aspect=record.crop_aspect,
        crop_x=float(record.crop_x),
        crop_y=float(record.crop_y),
        crop_zoom=float(record.crop_zoom),
        staging_key=record.staging_key,
        image_key=record.image_key,
        thumbnail_key=record.thumbnail_key,
        width=record.width,
        height=record.height,
        sort_key=Decimal(record.sort_key),
        status=GalleryPhotoStatus(record.status),
        uploader_id=record.uploader_id,
        created_at=record.created_at,
        updated_at=record.updated_at,
        published_at=record.published_at,
    )


class SqlAlchemyGalleryPhotoRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, photo: GalleryPhoto) -> GalleryPhoto:
        self._session.add(
            GalleryPhotoRecord(
                id=photo.id,
                title=photo.title,
                alt_text=photo.alt_text,
                description=photo.description,
                tags=list(photo.tags),
                city=photo.city,
                state=photo.state,
                captured_at=photo.captured_at,
                crop_aspect=photo.crop_aspect,
                crop_x=photo.crop_x,
                crop_y=photo.crop_y,
                crop_zoom=photo.crop_zoom,
                staging_key=photo.staging_key,
                image_key=photo.image_key,
                thumbnail_key=photo.thumbnail_key,
                width=photo.width,
                height=photo.height,
                sort_key=photo.sort_key,
                status=photo.status.value,
                uploader_id=photo.uploader_id,
                created_at=photo.created_at,
                updated_at=photo.updated_at,
                published_at=photo.published_at,
            )
        )
        await self._session.flush()
        return photo

    async def update(self, photo: GalleryPhoto) -> GalleryPhoto:
        record = await self._session.get(GalleryPhotoRecord, photo.id)
        if record is None:
            raise GalleryPhotoNotFoundError
        record.title = photo.title
        record.alt_text = photo.alt_text
        record.description = photo.description
        record.tags = list(photo.tags)
        record.city = photo.city
        record.state = photo.state
        record.captured_at = photo.captured_at
        record.crop_aspect = photo.crop_aspect
        record.crop_x = photo.crop_x
        record.crop_y = photo.crop_y
        record.crop_zoom = photo.crop_zoom
        record.staging_key = photo.staging_key
        record.image_key = photo.image_key
        record.thumbnail_key = photo.thumbnail_key
        record.width = photo.width
        record.height = photo.height
        record.sort_key = photo.sort_key
        record.status = photo.status.value
        record.updated_at = photo.updated_at
        record.published_at = photo.published_at
        await self._session.flush()
        return _to_domain_gallery_photo(record)

    async def delete(self, photo_id: UUID) -> None:
        record = await self._session.get(GalleryPhotoRecord, photo_id)
        if record is None:
            raise GalleryPhotoNotFoundError
        await self._session.delete(record)
        await self._session.flush()

    async def get_by_id(self, photo_id: UUID) -> GalleryPhoto | None:
        record = await self._session.get(GalleryPhotoRecord, photo_id)
        return None if record is None else _to_domain_gallery_photo(record)

    async def list_ready_page(
        self,
        *,
        limit: int,
        after: tuple[Decimal, UUID] | None,
        tag: str | None,
    ) -> list[GalleryPhoto]:
        query = select(GalleryPhotoRecord).where(
            GalleryPhotoRecord.status == GalleryPhotoStatus.READY.value
        )
        if tag is not None:
            query = query.where(GalleryPhotoRecord.tags.any(tag))
        if after is not None:
            sort_key, photo_id = after
            query = query.where(
                or_(
                    GalleryPhotoRecord.sort_key > sort_key,
                    and_(
                        GalleryPhotoRecord.sort_key == sort_key,
                        GalleryPhotoRecord.id > photo_id,
                    ),
                )
            )
        result = await self._session.execute(
            query.order_by(GalleryPhotoRecord.sort_key, GalleryPhotoRecord.id).limit(limit)
        )
        return [_to_domain_gallery_photo(record) for record in result.scalars().all()]

    async def list_all(self) -> list[GalleryPhoto]:
        result = await self._session.execute(
            select(GalleryPhotoRecord).order_by(
                GalleryPhotoRecord.sort_key,
                GalleryPhotoRecord.id,
            )
        )
        return [_to_domain_gallery_photo(record) for record in result.scalars().all()]

    async def max_sort_key(self) -> Decimal | None:
        result = await self._session.execute(select(func.max(GalleryPhotoRecord.sort_key)))
        value = result.scalar_one_or_none()
        return None if value is None else Decimal(value)
