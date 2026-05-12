"""Integration tests for the Policies module.

Tests cover:
- CRUD with tenant isolation
- Search and filtering (status, payment_status, expiry range, policy_type)
- Soft deletes
- Notes timeline
- Lifecycle actions (renew, expire)
- Upcoming renewals endpoint
- Cross-tenant isolation
- Document listing preparation
"""
from __future__ import annotations

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.agency import Agency
from app.models.customer import Customer
from app.models.policy import Policy, PolicyStatus, PaymentStatus
from app.models.user import User, UserRole


# =============================================================================
# Fixtures
# =============================================================================
@pytest.fixture(scope="function")
def test_customer(db: Session, test_agency: Agency) -> Customer:
    customer = Customer(
        name="Policy Holder",
        phone="+1-555-7777",
        agency_id=test_agency.id,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@pytest.fixture(scope="function")
def test_policy(db: Session, test_agency: Agency, test_customer: Customer) -> Policy:
    policy = Policy(
        customer_id=test_customer.id,
        policy_type="auto",
        policy_number="POL-001",
        start_date=date(2026, 1, 1),
        expiry_date=date(2026, 12, 31),
        premium=1200.00,
        status=PolicyStatus.ACTIVE,
        payment_status=PaymentStatus.PAID,
        insurer_name="SafeDrive Insurance",
        agency_id=test_agency.id,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@pytest.fixture(scope="function")
def other_agency_policy(db: Session) -> Policy:
    agency = Agency(name="Rival Agency")
    db.add(agency)
    db.flush()
    customer = Customer(name="Rival Customer", phone="+1-555-0000", agency_id=agency.id)
    db.add(customer)
    db.flush()
    policy = Policy(
        customer_id=customer.id,
        policy_type="home",
        policy_number="POL-RIVAL-001",
        start_date=date(2026, 1, 1),
        expiry_date=date(2026, 12, 31),
        premium=500.00,
        agency_id=agency.id,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


# =============================================================================
# CRUD
# =============================================================================
class TestPolicyCRUD:
    def test_create_policy(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        payload = {
            "customer_id": test_customer.id,
            "policy_type": "home",
            "policy_number": "POL-NEW-001",
            "start_date": "2026-01-01",
            "expiry_date": "2026-12-31",
            "premium": "2500.00",
            "insurer_name": "HomeSafe Insurance",
            "auto_renewal": True,
        }
        resp = client.post("/api/v1/policies", json=payload, headers=admin_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["policy_number"] == "POL-NEW-001"
        assert data["status"] == "active"
        assert data["payment_status"] == "pending"
        assert data["insurer_name"] == "HomeSafe Insurance"
        assert data["auto_renewal"] is True
        assert data["currency"] == "USD"

    def test_create_policy_dates_invalid(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        payload = {
            "customer_id": test_customer.id,
            "policy_type": "home",
            "policy_number": "POL-BAD-001",
            "start_date": "2026-12-31",
            "expiry_date": "2026-01-01",
            "premium": "100.00",
        }
        resp = client.post("/api/v1/policies", json=payload, headers=admin_headers)
        assert resp.status_code == 422

    def test_create_policy_duplicate_number(
        self, client: TestClient, admin_headers: dict, test_policy: Policy, test_customer: Customer
    ):
        payload = {
            "customer_id": test_customer.id,
            "policy_type": "auto",
            "policy_number": test_policy.policy_number,
            "start_date": "2026-01-01",
            "expiry_date": "2026-12-31",
            "premium": "100.00",
        }
        resp = client.post("/api/v1/policies", json=payload, headers=admin_headers)
        assert resp.status_code == 409

    def test_get_policy(self, client: TestClient, admin_headers: dict, test_policy: Policy):
        resp = client.get(f"/api/v1/policies/{test_policy.id}", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["policy_number"] == "POL-001"
        assert data["policy_notes"] == []
        assert data["days_until_expiry"] is not None

    def test_update_policy(self, client: TestClient, admin_headers: dict, test_policy: Policy):
        resp = client.patch(
            f"/api/v1/policies/{test_policy.id}",
            json={"insurer_name": "New Insurer", "premium": "1500.00"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["insurer_name"] == "New Insurer"
        assert data["premium"] == "1500.00"

    def test_update_policy_status_creates_note(
        self, client: TestClient, admin_headers: dict, test_policy: Policy
    ):
        resp = client.patch(
            f"/api/v1/policies/{test_policy.id}",
            json={"status": "cancelled"},
            headers=admin_headers,
        )
        assert resp.status_code == 200

        notes_resp = client.get(
            f"/api/v1/policies/{test_policy.id}/notes", headers=admin_headers
        )
        system_notes = [n for n in notes_resp.json() if n["note_type"] == "system"]
        assert len(system_notes) == 1
        assert "active to cancelled" in system_notes[0]["content"]

    def test_soft_delete_policy(self, client: TestClient, admin_headers: dict, test_policy: Policy):
        resp = client.delete(f"/api/v1/policies/{test_policy.id}", headers=admin_headers)
        assert resp.status_code == 204

        resp = client.get("/api/v1/policies", headers=admin_headers)
        ids = [p["id"] for p in resp.json()["items"]]
        assert test_policy.id not in ids

    def test_cross_tenant_not_visible(
        self, client: TestClient, admin_headers: dict, other_agency_policy: Policy
    ):
        resp = client.get(
            f"/api/v1/policies/{other_agency_policy.id}", headers=admin_headers
        )
        assert resp.status_code == 404


# =============================================================================
# Search & Filters
# =============================================================================
class TestPolicySearch:
    def test_search_by_policy_number(
        self, client: TestClient, admin_headers: dict, test_policy: Policy
    ):
        resp = client.get("/api/v1/policies?search=POL-001", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()["items"]) == 1
        assert resp.json()["items"][0]["policy_number"] == "POL-001"

    def test_search_by_insurer_name(
        self, client: TestClient, admin_headers: dict, test_policy: Policy
    ):
        resp = client.get("/api/v1/policies?search=SafeDrive", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()["items"]) == 1

    def test_filter_by_status(self, client: TestClient, admin_headers: dict, test_policy: Policy):
        resp = client.get("/api/v1/policies?status=active", headers=admin_headers)
        assert resp.status_code == 200
        assert all(p["status"] == "active" for p in resp.json()["items"])

    def test_filter_by_payment_status(
        self, client: TestClient, admin_headers: dict, test_policy: Policy
    ):
        resp = client.get("/api/v1/policies?payment_status=paid", headers=admin_headers)
        assert resp.status_code == 200
        assert all(p["payment_status"] == "paid" for p in resp.json()["items"])

    def test_filter_by_customer_id(
        self, client: TestClient, admin_headers: dict, test_policy: Policy
    ):
        resp = client.get(
            f"/api/v1/policies?customer_id={test_policy.customer_id}", headers=admin_headers
        )
        assert resp.status_code == 200
        assert all(p["customer_id"] == test_policy.customer_id for p in resp.json()["items"])

    def test_filter_by_expiry_range(
        self, client: TestClient, admin_headers: dict, test_policy: Policy
    ):
        resp = client.get(
            "/api/v1/policies?expiry_from=2026-12-01&expiry_to=2026-12-31",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert len(resp.json()["items"]) >= 1

    def test_sort_by_premium(self, client: TestClient, admin_headers: dict, db: Session, test_agency: Agency, test_customer: Customer):
        for i, premium in enumerate([300, 100]):
            db.add(Policy(
                customer_id=test_customer.id,
                policy_type="auto",
                policy_number=f"POL-SORT-{i}",
                start_date=date(2026, 1, 1),
                expiry_date=date(2026, 12, 31),
                premium=premium,
                agency_id=test_agency.id,
            ))
        db.commit()

        resp = client.get("/api/v1/policies?sort_by=premium&sort_order=asc", headers=admin_headers)
        premiums = [float(p["premium"]) for p in resp.json()["items"]]
        assert premiums.index(100) < premiums.index(300)


# =============================================================================
# Notes Timeline
# =============================================================================
class TestPolicyNotes:
    def test_add_note(self, client: TestClient, admin_headers: dict, test_policy: Policy):
        resp = client.post(
            f"/api/v1/policies/{test_policy.id}/notes",
            json={"content": "Claim discussed", "note_type": "claim"},
            headers=admin_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == "Claim discussed"
        assert data["note_type"] == "claim"

    def test_notes_ordered(self, client: TestClient, admin_headers: dict, test_policy: Policy):
        for i in range(3):
            client.post(
                f"/api/v1/policies/{test_policy.id}/notes",
                json={"content": f"Note {i}", "note_type": "general"},
                headers=admin_headers,
            )
        resp = client.get(f"/api/v1/policies/{test_policy.id}/notes", headers=admin_headers)
        contents = [n["content"] for n in resp.json()]
        assert contents == ["Note 2", "Note 1", "Note 0"]


# =============================================================================
# Lifecycle Actions
# =============================================================================
class TestPolicyLifecycle:
    def test_renew_policy(
        self, client: TestClient, admin_headers: dict, test_policy: Policy
    ):
        new_expiry = (test_policy.expiry_date + timedelta(days=365)).isoformat()
        resp = client.post(
            f"/api/v1/policies/{test_policy.id}/renew?new_expiry_date={new_expiry}&new_premium=1500.00",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "active"
        assert data["premium"] == "1500.00"

        # Verify renewal note
        notes_resp = client.get(
            f"/api/v1/policies/{test_policy.id}/notes", headers=admin_headers
        )
        renewal_notes = [n for n in notes_resp.json() if n["note_type"] == "renewed"]
        assert len(renewal_notes) == 1

    def test_expire_policy(self, client: TestClient, admin_headers: dict, test_policy: Policy):
        resp = client.post(
            f"/api/v1/policies/{test_policy.id}/expire", headers=admin_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "expired"


# =============================================================================
# Upcoming Renewals
# =============================================================================
class TestPolicyRenewals:
    def test_upcoming_renewals(
        self, client: TestClient, admin_headers: dict, db: Session, test_agency: Agency, test_customer: Customer
    ):
        # Create a policy expiring in 15 days
        policy = Policy(
            customer_id=test_customer.id,
            policy_type="health",
            policy_number="POL-RENEW-001",
            start_date=date.today(),
            expiry_date=date.today() + timedelta(days=15),
            premium=800.00,
            status=PolicyStatus.ACTIVE,
            agency_id=test_agency.id,
        )
        db.add(policy)
        db.commit()

        resp = client.get("/api/v1/policies/renewals/upcoming?days=30", headers=admin_headers)
        assert resp.status_code == 200
        ids = [p["id"] for p in resp.json()["items"]]
        assert policy.id in ids


# =============================================================================
# Documents (preparation)
# =============================================================================
class TestPolicyDocuments:
    def test_list_documents_empty(
        self, client: TestClient, admin_headers: dict, test_policy: Policy
    ):
        resp = client.get(
            f"/api/v1/policies/{test_policy.id}/documents", headers=admin_headers
        )
        assert resp.status_code == 200
        assert resp.json() == []
