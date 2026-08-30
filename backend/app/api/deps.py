from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.services.auth_service import AuthService

security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not auth or not auth.credentials:
        return None
    token = auth.credentials
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None

    user = await AuthService.get_by_id(db, user_id)
    if not user or not user.is_active:
        return None
    return user


async def get_current_user(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> User:
    if current_user:
        return current_user

    # Only in local development AND when explicitly enabled via flag can dev fallback apply
    if (
        settings.ENVIRONMENT == "development"
        and settings.ENABLE_DEV_AUTH_FALLBACK
    ):
        default_user = await AuthService.get_by_email(db, "rohan@fixora.dev")
        if default_user:
            return default_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication credentials were not provided or are invalid",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges are required for this action.",
        )
    return current_user
