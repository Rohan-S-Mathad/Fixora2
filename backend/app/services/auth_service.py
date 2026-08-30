from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.user import User
from backend.app.schemas.user import UserCreate
from backend.app.core.security import get_password_hash, verify_password


class AuthService:
    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email.lower().strip()))
        return result.scalars().first()

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
        user = User(
            email=user_in.email.lower().strip(),
            name=user_in.name,
            hashed_password=get_password_hash(user_in.password),
            role=user_in.role or "developer",
            avatar_url=user_in.avatar_url,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def get_all_users(db: AsyncSession) -> list[User]:
        result = await db.execute(select(User).order_by(User.name.asc()))
        return list(result.scalars().all())

    @staticmethod
    async def authenticate(
        db: AsyncSession, email: str, password: str
    ) -> Optional[User]:
        user = await AuthService.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
