"""Integration tests for the authentication flow.

These tests exercise the full stack: HTTP → route → service → repository → DB.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User, UserRole


class TestRegistration:
    def test_register_new_agency(self, client: TestClient, db: Session):
        payload = {
            "agency_name": "Acme Insurance",
            "subscription_plan": "starter",
            "admin_name": "Alice",
            "admin_email": "alice@acme.com",
            "admin_password": "Secret123!",
        }
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["agency"]["name"] == "Acme Insurance"
        assert data["user"]["email"] == "alice@acme.com"
        assert data["user"]["role"] == "agency_admin"
        assert "access_token" in data
        assert "refresh_token" in data

    def test_register_duplicate_agency_name(self, client: TestClient):
        payload = {
            "agency_name": "Dup Agency",
            "admin_name": "A",
            "admin_email": "a@test.com",
            "admin_password": "Secret123!",
        }
        r1 = client.post("/api/v1/auth/register", json=payload)
        assert r1.status_code == 201

        payload["admin_email"] = "b@test.com"
        r2 = client.post("/api/v1/auth/register", json=payload)
        assert r2.status_code == 409

    def test_register_duplicate_email(self, client: TestClient):
        payload = {
            "agency_name": "Agency 1",
            "admin_name": "A",
            "admin_email": "dup@example.com",
            "admin_password": "Secret123!",
        }
        r1 = client.post("/api/v1/auth/register", json=payload)
        assert r1.status_code == 201

        payload["agency_name"] = "Agency 2"
        r2 = client.post("/api/v1/auth/register", json=payload)
        assert r2.status_code == 409


class TestLogin:
    def test_login_success(self, client: TestClient, test_admin: User):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": test_admin.email, "password": "password123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_password(self, client: TestClient, test_admin: User):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": test_admin.email, "password": "wrong"},
        )
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client: TestClient):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@example.com", "password": "password123"},
        )
        assert resp.status_code == 401

    def test_login_disabled_user(self, client: TestClient, db: Session, test_admin: User):
        test_admin.is_active = False
        db.commit()
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": test_admin.email, "password": "password123"},
        )
        assert resp.status_code == 403

    def test_login_after_too_many_failures(self, client: TestClient, test_admin: User):
        # Exhaust failed attempts
        for _ in range(5):
            client.post(
                "/api/v1/auth/login",
                json={"email": test_admin.email, "password": "wrong"},
            )
        # Next attempt should be locked
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": test_admin.email, "password": "password123"},
        )
        assert resp.status_code == 423


class TestRefresh:
    def test_refresh_token_rotation(self, client: TestClient, test_admin: User):
        # Login to get tokens
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": test_admin.email, "password": "password123"},
        )
        refresh_token = login_resp.json()["refresh_token"]

        # Exchange refresh for new pair
        resp = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        # New refresh token should be different (rotation)
        assert data["refresh_token"] != refresh_token

    def test_refresh_with_invalid_token(self, client: TestClient):
        resp = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.here"},
        )
        assert resp.status_code == 401

    def test_refresh_with_access_token_fails(self, client: TestClient, test_admin: User):
        from app.core.security import create_access_token

        token = create_access_token(
            subject=test_admin.id,
            agency_id=test_admin.agency_id,
            role=test_admin.role.value,
        )
        resp = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": token},
        )
        assert resp.status_code == 401


class TestLogout:
    def test_logout_returns_204(self, client: TestClient, test_admin: User):
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": test_admin.email, "password": "password123"},
        )
        refresh_token = login_resp.json()["refresh_token"]
        resp = client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token},
        )
        assert resp.status_code == 204


class TestMe:
    def test_auth_me(self, client: TestClient, admin_headers: dict):
        resp = client.get("/api/v1/auth/me", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "user" in data
        assert "agency" in data
        assert data["user"]["email"] == "admin@test.com"

    def test_auth_me_no_token(self, client: TestClient):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    def test_users_me(self, client: TestClient, admin_headers: dict):
        resp = client.get("/api/v1/users/me", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == "admin@test.com"
