"""Dependencies for FairFare FastAPI endpoints.

Includes database session dependency, authentication & token verification,
current user loading, and sliding-window rate limiting dependencies.
"""

from collections.abc import AsyncGenerator
from datetime import datetime, timezone
import logging
from typing import Optional
from uuid import UUID, uuid4

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import rate_limiter, verify_token

logger = logging.getLogger(__name__)

# HTTP Bearer scheme with auto_error=False to allow optional token handling
security_bearer = HTTPBearer(auto_error=False)

# Standard mock user representation used for simulated environment
DEMO_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


def get_mock_user(user_id: Optional[UUID] = None, email: str = "user@fairfare.in") -> dict:
    """Return dictionary representation of the simulated mock user."""
    return {
        "id": user_id or DEMO_USER_ID,
        "email": email,
        "full_name": "Demo User",
        "is_active": True,
        "is_verified": True,
        "created_at": datetime.now(timezone.utc),
    }


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db),
):
    """Validate Bearer JWT access token and return the current user.

    In this simulated environment, validates the JWT token structure and signature,
    and returns a simulated user object matching UserResponse schema.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = verify_token(token)
    except ValueError as exc:
        logger.warning("Token verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    # Attempt to import UserResponse schema from app.schemas.user
    try:
        from app.schemas.user import UserResponse

        user_id = UUID(payload.sub) if payload.sub and len(payload.sub) == 36 else DEMO_USER_ID
        return UserResponse(
            id=user_id,
            email="user@fairfare.in",
            full_name="Demo User",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(timezone.utc),
        )
    except Exception as exc:
        logger.debug("Returning dict user response fallback: %s", exc)
        return get_mock_user()


async def get_current_active_user(
    current_user=Depends(get_current_user),
):
    """Ensure the authenticated user account is active."""
    # Handle both schema object and dict representation
    is_active = getattr(current_user, "is_active", None)
    if is_active is None and isinstance(current_user, dict):
        is_active = current_user.get("is_active", False)

    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )
    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db),
):
    """Optionally validate Bearer token; return None if token is absent or invalid."""
    if credentials is None:
        return None

    try:
        payload = verify_token(credentials.credentials)
        from app.schemas.user import UserResponse

        user_id = UUID(payload.sub) if payload.sub and len(payload.sub) == 36 else DEMO_USER_ID
        return UserResponse(
            id=user_id,
            email="user@fairfare.in",
            full_name="Demo User",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(timezone.utc),
        )
    except Exception:
        return None


class RateLimitDep:
    """FastAPI dependency for sliding-window rate limiting per client IP or key."""

    def __init__(self, requests_per_minute: int = 60, window_seconds: int = 60) -> None:
        self.requests_per_minute = requests_per_minute
        self.window_seconds = window_seconds

    async def __call__(self, request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown_client"
        allowed = rate_limiter.check_rate_limit(
            key=client_ip,
            limit=self.requests_per_minute,
            window_seconds=self.window_seconds,
        )
        if not allowed:
            remaining = rate_limiter.get_remaining_requests(
                key=client_ip,
                limit=self.requests_per_minute,
                window_seconds=self.window_seconds,
            )
            logger.warning("Rate limit exceeded for client %s", client_ip)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers={"Retry-After": str(self.window_seconds)},
            )
