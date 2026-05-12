"""Pytest fixtures for Zentro-ZIMS.

Architecture:
- ``db`` fixture: per-test SQLite in-memory database with tables created.
- ``client`` fixture: TestClient with the FastAPI app.
- ``auth_headers`` fixture: factory that returns Authorization headers.

All fixtures use ``function`` scope for test isolation.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.agency import Agency
from app.models.user import User, UserRole
from app.repositories.agency import AgencyRepository
from app.repositories.user import UserRepository

# In-memory SQLite for fast unit tests
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=pytest.importorskip("sqlalchemy.pool").StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=Session
)


# =============================================================================
# Database fixture
# =============================================================================
@pytest.fixture(scope="function")
def db() -> Session:
    """Create a fresh in-memory database for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


# =============================================================================
# TestClient with DB override
# =============================================================================
@pytest.fixture(scope="function")
def client(db: Session) -> TestClient:
    """FastAPI TestClient with DB session overridden."""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# =============================================================================
# Auth helpers
# =============================================================================
@pytest.fixture(scope="function")
def test_agency(db: Session) -> Agency:
    """Create a standard test agency."""
    agency = Agency(name="Test Agency", subscription_plan="starter")
    db.add(agency)
    db.commit()
    db.refresh(agency)
    return agency


@pytest.fixture(scope="function")
def test_admin(db: Session, test_agency: Agency) -> User:
    """Create an agency_admin user in the test agency."""
    user = User(
        name="Admin User",
        email="admin@test.com",
        hashed_password=hash_password("password123"),
        role=UserRole.AGENCY_ADMIN,
        is_active=True,
        agency_id=test_agency.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_agent(db: Session, test_agency: Agency) -> User:
    """Create an agent user in the test agency."""
    user = User(
        name="Agent User",
        email="agent@test.com",
        hashed_password=hash_password("password123"),
        role=UserRole.AGENT,
        is_active=True,
        agency_id=test_agency.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_staff(db: Session, test_agency: Agency) -> User:
    """Create a staff user in the test agency."""
    user = User(
        name="Staff User",
        email="staff@test.com",
        hashed_password=hash_password("password123"),
        role=UserRole.STAFF,
        is_active=True,
        agency_id=test_agency.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_headers(test_admin: User) -> dict[str, str]:
    """Authorization headers for the test admin."""
    token = create_access_token(
        subject=test_admin.id,
        agency_id=test_admin.agency_id,
        role=test_admin.role.value,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def agent_headers(test_agent: User) -> dict[str, str]:
    """Authorization headers for the test agent."""
    token = create_access_token(
        subject=test_agent.id,
        agency_id=test_agent.agency_id,
        role=test_agent.role.value,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def staff_headers(test_staff: User) -> dict[str, str]:
    """Authorization headers for the test staff."""
    token = create_access_token(
        subject=test_staff.id,
        agency_id=test_staff.agency_id,
        role=test_staff.role.value,
    )
    return {"Authorization": f"Bearer {token}"}
