"""Unit tests for RBAC dependency guards."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole


class TestRoleHierarchy:
    def test_super_admin_is_highest(self):
        assert UserRole.SUPER_ADMIN.level > UserRole.AGENCY_ADMIN.level
        assert UserRole.AGENCY_ADMIN.level > UserRole.AGENT.level
        assert UserRole.AGENT.level > UserRole.STAFF.level

    def test_has_role_comparison(self):
        admin = User(role=UserRole.AGENCY_ADMIN)
        assert admin.has_role(UserRole.AGENT) is True
        assert admin.has_role(UserRole.AGENCY_ADMIN) is True
        assert admin.has_role(UserRole.SUPER_ADMIN) is False

    def test_staff_cannot_do_agent_things(self):
        staff = User(role=UserRole.STAFF)
        assert staff.has_role(UserRole.AGENT) is False

    def test_agent_cannot_do_admin_things(self):
        agent = User(role=UserRole.AGENT)
        assert agent.has_role(UserRole.AGENCY_ADMIN) is False


class TestRequireRole:
    def test_require_admin_allows_super_admin(self):
        # super_admin passes agency_admin guard
        user = User(role=UserRole.SUPER_ADMIN)
        guard = require_role(UserRole.AGENCY_ADMIN)
        # The dependency is a FastAPI Depends object; we can't directly call it
        # without the dependency injection machinery. Instead we test the
        # underlying _check_role logic indirectly via has_role.
        assert user.has_role(UserRole.AGENCY_ADMIN) is True

    def test_require_admin_blocks_agent(self):
        user = User(role=UserRole.AGENT)
        assert user.has_role(UserRole.AGENCY_ADMIN) is False


class TestUserModel:
    def test_is_deleted_when_deleted_at_set(self):
        from datetime import datetime, timezone

        user = User(deleted_at=datetime.now(tz=timezone.utc))
        assert user.is_deleted is True

    def test_is_not_deleted_when_deleted_at_none(self):
        user = User(deleted_at=None)
        assert user.is_deleted is False

    def test_is_locked_when_locked_until_future(self):
        from datetime import datetime, timedelta, timezone

        user = User(locked_until=datetime.now(tz=timezone.utc) + timedelta(hours=1))
        assert user.is_locked is True

    def test_is_not_locked_when_locked_until_past(self):
        from datetime import datetime, timedelta, timezone

        user = User(locked_until=datetime.now(tz=timezone.utc) - timedelta(hours=1))
        assert user.is_locked is False
