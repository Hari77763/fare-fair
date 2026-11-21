"""User authentication and profile schemas for FairFare backend."""

import re
from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)

try:
    from pydantic import EmailStr, TypeAdapter

    TypeAdapter(EmailStr)
except Exception:
    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

    def _validate_email(v: str) -> str:
        if not isinstance(v, str) or not EMAIL_REGEX.match(v.strip()):
            raise ValueError("value is not a valid email address")
        return v.strip().lower()

    EmailStr = Annotated[str, AfterValidator(_validate_email)]  # type: ignore


class UserCreate(BaseModel):
    """Schema for registering a new user account."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ...,
        min_length=8,
        description="User password with minimum 8 characters",
    )
    full_name: str = Field(..., min_length=1, description="User's full name")

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """Schema for user credentials authentication."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class UserResponse(BaseModel):
    """User profile response schema."""

    id: UUID = Field(..., description="Unique user identifier")
    email: EmailStr = Field(..., description="User email address")
    full_name: str = Field(..., description="User full name")
    is_active: bool = Field(default=True, description="Account active status")
    is_verified: bool = Field(default=False, description="Email verification status")
    created_at: datetime = Field(
        default_factory=_utc_now,
        description="Account creation timestamp",
    )

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """JWT access and refresh token response."""

    access_token: str = Field(..., description="Signed JWT access token")
    refresh_token: str = Field(..., description="Signed JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")

    model_config = ConfigDict(from_attributes=True)


class TokenRefresh(BaseModel):
    """Request schema for refreshing an expired access token."""

    refresh_token: str = Field(..., description="Valid refresh token")

    model_config = ConfigDict(from_attributes=True)
