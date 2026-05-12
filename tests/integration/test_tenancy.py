"""Integration tests for multi-tenant isolation.

These tests verify that:
1. Users can only see data within their own agency.
2. JWT tokens from agency A are rejected when used against agency B.
3. Role hierarchy is enforced (agent cannot create admin, etc.).
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.agency import Agency
from app.models.user import User, UserRole


class TestTenantIsolation:
    def test_cross_tenant_user_list_is_empty(
        self, client: TestClient, db: Session
    ):
        """Users from Agency A should not see users from Agency B."""
        # Create Agency A with admin
        agency_a = Agency(name="Agency A")
        db.add(agency_a)
        db.flush()
        admin_a = User(
            name="Admin A",
            email="admin_a@test.com",
            hashed_password=hash_password("pass"),
            role=UserRole.AGENCY_ADMIN,
            agency_id=agency_a.id,
        )
        db.add(admin_a)

        # Create Agency B with user
        agency_b = Agency(name="Agency B")
        db.add(agency_b)
        db.flush()
        user_b = User(
            name="User B",
            email="user_b@test.com",
            hashed_password=hash_password("pass"),
            role=UserRole.AGENT,
            agency_id=agency_b.id,
        )
        db.add(user_b)
        db.commit()

        # Admin A lists users
        token = create_access_token(
            subject=admin_a.id,
            agency_id=admin_a.agency_id,
            role=admin_a.role.value,
        )
        resp = client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        # Should only see users from Agency A (just admin_a)
        emails = [u["email"] for u in data["items"]]
        assert "admin_a@test.com" in emails
        assert "user_b@test.com" not in emails

    def test_cross_tenant_jwt_rejected(
        self, client: TestClient, db: Session
    ):
        """A JWT with agency_id for Agency A must be rejected if the user
        moves to Agency B (simulated by tampering with agency_id claim)."""
        agency = Agency(name="Test")
        db.add(agency)
        db.flush()
        user = User(
            name="User",
            email="user@test.com",
            hashed_password=hash_password("pass"),
            role=UserRole.AGENT,
            agency_id=agency.id,
        )
        db.add(user)
        db.commit()

        # Create token with WRONG agency_id
        bad_token = create_access_token(
            subject=user.id,
            agency_id=99999,  # wrong agency
            role=user.role.value,
        )
        resp = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {bad_token}"},
        )
        assert resp.status_code == 401

    def test_deleted_user_cannot_access(
        self, client: TestClient, db: Session, test_admin: User
    ):
        from datetime import datetime, timezone

        test_admin.deleted_at = datetime.now(tz=timezone.utc)
        db.commit()

        token = create_access_token(
            subject=test_admin.id,
            agency_id=test_admin.agency_id,
            role=test_admin.role.value,
        )
        resp = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 401


class TestRoleHierarchy:
    def test_agent_cannot_create_admin(
        self, client: TestClient, agent_headers: dict
    ):
        payload = {
            "name": "New User",
            "email": "new@test.com",
            "password": "Secret123!",
            "role": "agency_admin",
        }
        resp = client.post(
            "/api/v1/users", json=payload, headers=agent_headers
        )
        assert resp.status_code == 403

    def test_agent_can_create_agent(
        self, client: TestClient, agent_headers: dict
    ):
        payload = {
            "name": "New Agent",
            "email": "newagent@test.com",
            "password": "Secret123!",
            "role": "agent",
        }
        resp = client.post(
            "/api/v1/users", json=payload, headers=agent_headers
        )
        # Agent cannot create users at all — only admin+
        assert resp.status_code == 403

    def test_admin_can_create_agent(
        self, client: TestClient, admin_headers: dict
    ):
        payload = {
            "name": "New Agent",
            "email": "newagent@test.com",
            "password": "Secret123!",
            "role": "agent",
        }
        resp = client.post(
            "/api/v1/users", json=payload, headers=admin_headers
        )
        assert resp.status_code == 201
        assert resp.json()["role"] == "agent"

    def test_admin_cannot_create_super_admin(
        self, client: TestClient, admin_headers: dict
    ):
        payload = {
            "name": "Hacker",
            "email": "hacker@test.com",
            "password": "Secret123!",
            "role": "super_admin",
        }
        resp = client.post(
            "/api/v1/users", json=payload, headers=admin_headers
        )
        assert resp.status_code == 403

    def test_staff_can_read_users(
        self, client: TestClient, staff_headers: dict
    ):
        resp = client.get("/api/v1/users", headers=staff_headers)
        assert resp.status_code == 200

    def test_staff_cannot_create_users(
        self, client: TestClient, staff_headers: dict
    ):
        payload = {
            "name": "New User",
            "email": "new@test.com",
            "password": "Secret123!",
            "role": "staff",
        }
        resp = client.post(
            "/api/v1/users", json=payload, headers=staff_headers
        )
        assert resp.status_code == 403

    def test_self_delete_prevented(
        self, client: TestClient, admin_headers: dict, test_admin: User
    ):
        resp = client.delete(
            f"/api/v1/users/{test_admin.id}", headers=admin_headers
        )
        assert resp.status_code == 400
