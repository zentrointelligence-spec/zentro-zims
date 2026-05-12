"""Password hashing + JWT encoding/decoding with refresh token support.

Architecture:
- Access tokens: short-lived (default 30 min), used for every API request.
- Refresh tokens: long-lived (default 7 days), used only to obtain new access
  tokens. Stored with a ``jti`` (JWT ID) so they can be blacklisted on logout.
- Token blacklisting: if Redis is available, logout adds the refresh token
  jti to a Redis set with TTL = token remaining lifetime. If Redis is
  unavailable, logout is client-side only (token stays valid until expiry).

Security trade-offs:
- We use symmetric HS256 because the auth service is the only issuer/verifier.
  RS256 would be needed only if third-party services verify tokens independently.
- ``jti`` is a UUID4 — cryptographically random and unguessable.
- Token payloads are minimal (sub, agency_id, role, type, jti, iat, exp) to
  keep JWT size small and avoid stale-data issues.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token type constants
ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain, hashed)


def _now_ts() -> int:
    """Current UTC time as Unix timestamp."""
    return int(datetime.now(tz=timezone.utc).timestamp())


def _create_token(
    subject: str | int,
    token_type: str,
    agency_id: int,
    role: str,
    expires_delta: timedelta,
    jti: str | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> tuple[str, str]:
    """Create a JWT and return (token, jti).

    Parameters:
        subject: user id
        token_type: "access" or "refresh"
        agency_id: tenant id
        role: user's role string
        expires_delta: token lifetime
        jti: optional JWT ID (generated if not provided)
        extra_claims: additional claims to embed

    Returns:
        (encoded_jwt, jti)
    """
    now = _now_ts()
    expire = now + int(expires_delta.total_seconds())
    token_jti = jti or str(uuid.uuid4())

    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "agency_id": agency_id,
        "role": role,
        "jti": token_jti,
        "iat": now,
        "exp": expire,
    }
    if extra_claims:
        payload.update(extra_claims)

    encoded = jwt.encode(
        payload, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded, token_jti


def create_access_token(
    subject: str | int,
    *,
    agency_id: int,
    role: str,
    expires_minutes: int | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Issue a short-lived access token.

    The token embeds:
      - sub: user id
      - type: "access"
      - agency_id: tenant id
      - role: user role
      - jti: unique token id
      - iat / exp: timestamps
    """
    delta = timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    token, _ = _create_token(
        subject=subject,
        token_type=ACCESS_TOKEN_TYPE,
        agency_id=agency_id,
        role=role,
        expires_delta=delta,
        extra_claims=extra_claims,
    )
    return token


def create_refresh_token(
    subject: str | int,
    *,
    agency_id: int,
    role: str,
    expires_days: int | None = None,
) -> tuple[str, str]:
    """Issue a long-lived refresh token.

    Returns:
        (token, jti) — the jti must be stored server-side or in Redis
        to enable revocation on logout.
    """
    delta = timedelta(
        days=expires_days or settings.refresh_token_expire_days
    )
    return _create_token(
        subject=subject,
        token_type=REFRESH_TOKEN_TYPE,
        agency_id=agency_id,
        role=role,
        expires_delta=delta,
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decode + verify a JWT (signature + expiry + required claims).

    Raises ``JWTError`` on any validation failure.
    """
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=[settings.algorithm],
        options={
            "verify_signature": True,
            "verify_exp": True,
            "require_exp": True,
        },
    )


def get_token_jti(token: str) -> str | None:
    """Extract the jti claim without verifying signature (for logout).

    This is safe because we only use it to blacklist a token the user
    already possesses; an attacker cannot exploit this to discover jtis.
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            options={"verify_signature": False, "verify_exp": False},
        )
        return payload.get("jti")
    except JWTError:
        return None


def blacklist_refresh_token(token: str) -> bool:
    """Blacklist a refresh token via Redis (best-effort).

    Returns True if successfully blacklisted, False if Redis is unavailable.
    The caller should always proceed with logout regardless of return value.
    """
    jti = get_token_jti(token)
    if jti is None:
        return False

    try:
        import redis as redis_lib
        from app.core.config import settings

        r = redis_lib.from_url(settings.redis_url, decode_responses=True)
        # TTL = refresh token expiry to auto-clean
        ttl = settings.refresh_token_expire_days * 86400
        key = f"{settings.redis_token_blacklist_prefix}:{jti}"
        r.setex(key, ttl, "1")
        r.close()
        return True
    except Exception:
        return False


def is_token_blacklisted(token: str) -> bool:
    """Check if a token's jti exists in the Redis blacklist."""
    jti = get_token_jti(token)
    if jti is None:
        return True  # treat unparseable tokens as blacklisted

    try:
        import redis as redis_lib
        from app.core.config import settings

        r = redis_lib.from_url(settings.redis_url, decode_responses=True)
        key = f"{settings.redis_token_blacklist_prefix}:{jti}"
        blacklisted = r.exists(key) == 1
        r.close()
        return blacklisted
    except Exception:
        return False  # if Redis is down, allow token (fail open for availability)


__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "get_token_jti",
    "blacklist_refresh_token",
    "is_token_blacklisted",
    "ACCESS_TOKEN_TYPE",
    "REFRESH_TOKEN_TYPE",
    "JWTError",
]
