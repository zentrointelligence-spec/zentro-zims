"""Unit tests for JWT and password security functions."""
from __future__ import annotations

import time

import pytest
from jose import JWTError

from app.core.security import (
    ACCESS_TOKEN_TYPE,
    REFRESH_TOKEN_TYPE,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_jti,
    hash_password,
    is_token_blacklisted,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_and_verify(self):
        pwd = "SuperSecret123!"
        hashed = hash_password(pwd)
        assert verify_password(pwd, hashed) is True
        assert verify_password("wrong", hashed) is False

    def test_hash_is_not_plaintext(self):
        pwd = "plaintext"
        hashed = hash_password(pwd)
        assert pwd not in hashed


class TestAccessToken:
    def test_create_and_decode(self):
        token = create_access_token(
            subject=42, agency_id=1, role="agency_admin"
        )
        payload = decode_token(token)
        assert payload["sub"] == "42"
        assert payload["agency_id"] == 1
        assert payload["role"] == "agency_admin"
        assert payload["type"] == ACCESS_TOKEN_TYPE
        assert "jti" in payload
        assert "exp" in payload

    def test_token_expires(self):
        token = create_access_token(
            subject=1, agency_id=1, role="agent", expires_minutes=-1
        )
        with pytest.raises(JWTError):
            decode_token(token)

    def test_tampered_token_fails(self):
        token = create_access_token(subject=1, agency_id=1, role="agent")
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(JWTError):
            decode_token(tampered)


class TestRefreshToken:
    def test_create_and_decode(self):
        token, jti = create_refresh_token(
            subject=99, agency_id=2, role="super_admin"
        )
        payload = decode_token(token)
        assert payload["sub"] == "99"
        assert payload["type"] == REFRESH_TOKEN_TYPE
        assert payload["jti"] == jti

    def test_jti_extraction_without_verification(self):
        token, jti = create_refresh_token(
            subject=1, agency_id=1, role="agent"
        )
        extracted = get_token_jti(token)
        assert extracted == jti

    def test_blacklist_check_on_fresh_token(self):
        token, _ = create_refresh_token(subject=1, agency_id=1, role="agent")
        # Without Redis, is_token_blacklisted returns False (fail open)
        assert is_token_blacklisted(token) is False


class TestTokenClaims:
    def test_extra_claims_embedded(self):
        token = create_access_token(
            subject=1,
            agency_id=1,
            role="agent",
            extra_claims={"foo": "bar"},
        )
        payload = decode_token(token)
        assert payload["foo"] == "bar"
