"""Security, authentication, password hashing, and token handling for FairFare.

Provides JWT generation/verification, bcrypt hashing, API key creation,
and an in-memory sliding-window rate limiter.
"""

from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets
import time
from typing import Any, Dict, Optional, Union

# Handle JWT import: support both PyJWT and python-jose
try:
    import jwt
    from jwt.exceptions import PyJWTError as JWTError
except ImportError:
    from jose import JWTError, jwt

# Password hashing with fallback to standard hashlib pbkdf2_hmac if passlib is missing
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except ImportError:
    pwd_context = None

from pydantic import BaseModel

from app.core.config import settings


class TokenPayload(BaseModel):
    """Pydantic schema representing the validated payload of a JWT."""

    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generate a signed JWT access token with UTC expiration."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp()),
        "type": "access",
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generate a signed JWT refresh token with UTC expiration."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp()),
        "type": "refresh",
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def verify_token(token: str) -> TokenPayload:
    """Decode and validate a JWT string against the secret key and algorithm.

    Raises:
        ValueError: If the token is invalid, corrupted, or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        sub: Optional[str] = payload.get("sub")
        exp: Optional[int] = payload.get("exp")
        token_type: Optional[str] = payload.get("type")

        if sub is None:
            raise ValueError("Token subject (sub) missing")

        return TokenPayload(sub=sub, exp=exp, type=token_type)
    except JWTError as exc:
        raise ValueError(f"Could not validate token credentials: {str(exc)}") from exc


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt or pbkdf2_sha256."""
    if pwd_context is not None:
        return pwd_context.hash(password)
    salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"pbkdf2:{salt}:{pw_hash}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify that a plaintext password matches the stored hash."""
    if pwd_context is not None and not hashed_password.startswith("pbkdf2:"):
        return pwd_context.verify(plain_password, hashed_password)
    if hashed_password.startswith("pbkdf2:"):
        _, salt, expected_hash = hashed_password.split(":")
        calc_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
        return hmac.compare_digest(calc_hash, expected_hash)
    if pwd_context is not None:
        return pwd_context.verify(plain_password, hashed_password)
    return False


def generate_api_key(length: int = 32) -> str:
    """Generate a secure, URL-safe random API key."""
    return f"ff_{secrets.token_urlsafe(length)}"


class RateLimiter:
    """Sliding-window in-memory rate limiter based on monotonic timestamps."""

    def __init__(self, default_limit: Optional[int] = None, window_seconds: int = 60) -> None:
        self.default_limit: int = default_limit or settings.API_RATE_LIMIT_PER_MINUTE
        self.window_seconds: int = window_seconds
        # Maps key -> deque of monotonic hit timestamps
        self._requests: Dict[str, deque] = defaultdict(deque)

    def check_rate_limit(
        self,
        key: str,
        limit: Optional[int] = None,
        window_seconds: Optional[int] = None,
    ) -> bool:
        """Check whether the given key has exceeded its rate limit.

        Args:
            key: Unique identifier (e.g. client IP, user UUID, or API key).
            limit: Maximum allowed requests within the time window.
            window_seconds: Length of the sliding window in seconds.

        Returns:
            bool: True if request is allowed, False if limit is exceeded.
        """
        now = time.monotonic()
        allowed_limit = limit if limit is not None else self.default_limit
        win_sec = window_seconds if window_seconds is not None else self.window_seconds

        queue = self._requests[key]
        cutoff = now - win_sec

        # Evict timestamps outside the sliding window
        while queue and queue[0] < cutoff:
            queue.popleft()

        if len(queue) >= allowed_limit:
            return False

        queue.append(now)
        return True

    def get_remaining_requests(
        self,
        key: str,
        limit: Optional[int] = None,
        window_seconds: Optional[int] = None,
    ) -> int:
        """Return the count of remaining allowed calls for key within current window."""
        now = time.monotonic()
        allowed_limit = limit if limit is not None else self.default_limit
        win_sec = window_seconds if window_seconds is not None else self.window_seconds

        queue = self._requests[key]
        cutoff = now - win_sec

        while queue and queue[0] < cutoff:
            queue.popleft()

        return max(0, allowed_limit - len(queue))

    def reset(self, key: Optional[str] = None) -> None:
        """Reset history for a specific key or clear all rate limiting records."""
        if key is not None:
            if key in self._requests:
                del self._requests[key]
        else:
            self._requests.clear()


# Global rate limiter instance initialized with settings
rate_limiter = RateLimiter(default_limit=settings.API_RATE_LIMIT_PER_MINUTE)
