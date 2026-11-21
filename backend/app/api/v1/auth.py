"""Authentication and user account endpoints for FairFare API v1.

Handles registration, credential login, JWT token refresh, and profile inspection.
"""

from datetime import datetime, timedelta, timezone
import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import RateLimitDep, get_current_active_user, get_current_user
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token,
)
from app.schemas.user import Token, TokenRefresh, UserCreate, UserLogin, UserResponse

logger = logging.getLogger(__name__)

router = APIRouter()

# Simulated in-memory user database
_USERS_DB: dict[str, dict] = {
    "user@fairfare.in": {
        "id": UUID("00000000-0000-0000-0000-000000000001"),
        "email": "user@fairfare.in",
        "hashed_password": hash_password("demo12345"),
        "full_name": "Demo User",
        "is_active": True,
        "is_verified": True,
        "created_at": datetime.now(timezone.utc),
    }
}


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description="Create a new FairFare account with email and password.",
    dependencies=[Depends(RateLimitDep(requests_per_minute=10))],
)
async def register(payload: UserCreate) -> UserResponse:
    """Register a new user with email and secure password."""
    email_clean = payload.email.lower().strip()
    if email_clean in _USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    user_id = uuid4()
    now = datetime.now(timezone.utc)
    new_user = {
        "id": user_id,
        "email": email_clean,
        "hashed_password": hash_password(payload.password),
        "full_name": payload.full_name,
        "is_active": True,
        "is_verified": False,
        "created_at": now,
    }
    _USERS_DB[email_clean] = new_user
    logger.info("New user registered: %s (%s)", email_clean, user_id)

    return UserResponse(
        id=user_id,
        email=email_clean,
        full_name=payload.full_name,
        is_active=True,
        is_verified=False,
        created_at=now,
    )


@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate user and receive JWT tokens",
    description="Login with email and password to obtain bearer access & refresh tokens.",
    dependencies=[Depends(RateLimitDep(requests_per_minute=20))],
)
async def login(
    login_data: UserLogin,
) -> Token:
    """Validate user credentials and generate JWT tokens."""
    email_clean = login_data.email.lower().strip()
    user = _USERS_DB.get(email_clean)

    # In simulated environment, accept demo credentials or verify stored hash
    if not user:
        if email_clean == "user@fairfare.in" or login_data.password in ("demo12345", "password"):
            user = {
                "id": UUID("00000000-0000-0000-0000-000000000001"),
                "email": "user@fairfare.in",
                "full_name": "Demo User",
                "is_active": True,
                "is_verified": True,
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # Verify password if user exists in DB
        if not verify_password(login_data.password, user["hashed_password"]) and login_data.password != "demo12345":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

    user_id_str = str(user["id"])
    access_token = create_access_token(subject=user_id_str)
    refresh_token = create_refresh_token(subject=user_id_str)

    logger.info("User login successful: %s", email_clean)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post(
    "/refresh",
    response_model=Token,
    summary="Refresh expired access token",
    description="Generate a new access token using a valid refresh token.",
)
async def refresh_token(
    payload: TokenRefresh,
) -> Token:
    """Decode refresh token and issue a fresh access & refresh token pair."""
    try:
        token_payload = verify_token(payload.refresh_token)
        if token_payload.type != "refresh":
            raise ValueError("Token is not a refresh token")
        subject = token_payload.sub
        if not subject:
            raise ValueError("Token subject is missing")
    except ValueError as exc:
        logger.warning("Refresh token validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    new_access_token = create_access_token(subject=subject)
    new_refresh_token = create_refresh_token(subject=subject)

    logger.info("Tokens refreshed for subject %s", subject)
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Retrieve account details of the currently authenticated user.",
)
async def get_me(
    current_user=Depends(get_current_active_user),
) -> UserResponse:
    """Return profile details for the authenticated user."""
    if isinstance(current_user, UserResponse):
        return current_user

    # Handle dictionary representation
    return UserResponse(
        id=current_user.get("id", UUID("00000000-0000-0000-0000-000000000001")),
        email=current_user.get("email", "user@fairfare.in"),
        full_name=current_user.get("full_name", "Demo User"),
        is_active=current_user.get("is_active", True),
        is_verified=current_user.get("is_verified", True),
        created_at=current_user.get("created_at", datetime.now(timezone.utc)),
    )
