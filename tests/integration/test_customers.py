"""Integration tests for the Customers module.

Tests cover:
- CRUD with tenant isolation
- Search and KYC filtering
- Soft deletes
- Notes timeline
- Dependent management
- Lead conversion
- Document listing (preparation)
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.agency import Agency
from app.models.customer import Customer
from app.models.lead import Lead, LeadStatus
from datetime import date
from app.models.user import User, UserRole


# =============================================================================
# Fixtures
# =============================================================================
@pytest.fixture(scope="function")
def test_customer(db: Session, test_agency: Agency) -> Customer:
    customer = Customer(
        name="Bob Insured",
        phone="+1-555-7777",
        email="bob@example.com",
        address="456 Oak Ave",
        date_of_birth=date(1980, 7, 20),
        id_number="ID123456",
        id_type="passport",
        nationality="US",
        occupation="Doctor",
        risk_profile="medium",
        kyc_verified=True,
        preferred_contact="email",
        agency_id=test_agency.id,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@pytest.fixture(scope="function")
def other_agency_customer(db: Session) -> Customer:
    agency = Agency(name="Rival Agency")
    db.add(agency)
    db.flush()
    customer = Customer(
        name="Rival Customer",
        phone="+1-555-0000",
        agency_id=agency.id,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


# =============================================================================
# CRUD
# =============================================================================
class TestCustomerCRUD:
    def test_create_customer(self, client: TestClient, admin_headers: dict):
        payload = {
            "name": "Alice Policyholder",
            "phone": "+1-555-8888",
            "email": "alice@example.com",
            "address": "789 Pine Rd",
            "date_of_birth": "1990-01-15",
            "id_number": "ID987654",
            "id_type": "national_id",
            "nationality": "CA",
            "occupation": "Engineer",
            "risk_profile": "low",
            "preferred_contact": "phone",
        }
        resp = client.post("/api/v1/customers", json=payload, headers=admin_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Alice Policyholder"
        assert data["kyc_verified"] is False
        assert data["policy_count"] == 0

    def test_get_customer(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        resp = client.get(f"/api/v1/customers/{test_customer.id}", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Bob Insured"
        assert data["id_type"] == "passport"
        assert data["risk_profile"] == "medium"
        assert data["customer_notes"] == []

    def test_update_customer(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        resp = client.patch(
            f"/api/v1/customers/{test_customer.id}",
            json={"occupation": "Surgeon", "risk_profile": "high"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["occupation"] == "Surgeon"
        assert data["risk_profile"] == "high"

    def test_soft_delete_customer(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        resp = client.delete(f"/api/v1/customers/{test_customer.id}", headers=admin_headers)
        assert resp.status_code == 204

        resp = client.get("/api/v1/customers", headers=admin_headers)
        ids = [c["id"] for c in resp.json()["items"]]
        assert test_customer.id not in ids

    def test_cross_tenant_not_visible(
        self, client: TestClient, admin_headers: dict, other_agency_customer: Customer
    ):
        resp = client.get(
            f"/api/v1/customers/{other_agency_customer.id}", headers=admin_headers
        )
        assert resp.status_code == 404


# =============================================================================
# Search & Filters
# =============================================================================
class TestCustomerSearch:
    def test_search_by_name(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        resp = client.get("/api/v1/customers?search=Bob", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()["items"]) == 1
        assert resp.json()["items"][0]["name"] == "Bob Insured"

    def test_search_by_id_number(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        resp = client.get("/api/v1/customers?search=ID123456", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()["items"]) == 1

    def test_filter_kyc_verified(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        resp = client.get("/api/v1/customers?kyc_verified=true", headers=admin_headers)
        assert resp.status_code == 200
        assert all(c["kyc_verified"] is True for c in resp.json()["items"])

    def test_filter_risk_profile(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        resp = client.get("/api/v1/customers?risk_profile=medium", headers=admin_headers)
        assert resp.status_code == 200
        assert all(c["risk_profile"] == "medium" for c in resp.json()["items"])

    def test_sort_by_name(self, client: TestClient, admin_headers: dict, db: Session, test_agency: Agency):
        for name in ["Zebra", "Alpha"]:
            db.add(Customer(name=name, phone="+1-555-0000", agency_id=test_agency.id))
        db.commit()

        resp = client.get("/api/v1/customers?sort_by=name&sort_order=asc", headers=admin_headers)
        names = [c["name"] for c in resp.json()["items"]]
        assert names.index("Alpha") < names.index("Zebra")


# =============================================================================
# Notes Timeline
# =============================================================================
class TestCustomerNotes:
    def test_add_note(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        resp = client.post(
            f"/api/v1/customers/{test_customer.id}/notes",
            json={"content": "Renewal discussed", "note_type": "call"},
            headers=admin_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == "Renewal discussed"
        assert data["note_type"] == "call"

    def test_notes_ordered(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        for i in range(3):
            client.post(
                f"/api/v1/customers/{test_customer.id}/notes",
                json={"content": f"Note {i}", "note_type": "general"},
                headers=admin_headers,
            )
        resp = client.get(f"/api/v1/customers/{test_customer.id}/notes", headers=admin_headers)
        contents = [n["content"] for n in resp.json()]
        assert contents == ["Note 2", "Note 1", "Note 0"]


# =============================================================================
# Dependents
# =============================================================================
class TestCustomerDependents:
    def test_add_dependent(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        payload = {
            "name": "Bob Jr",
            "date_of_birth": "2010-05-10",
            "relationship": "child",
            "id_number": "CHILD123",
        }
        resp = client.post(
            f"/api/v1/customers/{test_customer.id}/dependents",
            json=payload,
            headers=admin_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Bob Jr"
        assert data["relationship"] == "child"

    def test_list_dependents(self, client: TestClient, admin_headers: dict, test_customer: Customer):
        resp = client.get(
            f"/api/v1/customers/{test_customer.id}/dependents", headers=admin_headers
        )
        assert resp.status_code == 200
        # Initially empty
        assert resp.json() == []

    def test_remove_dependent(self, client: TestClient, admin_headers: dict, test_customer: Customer, db: Session):
        from app.models.dependent import Dependent

        dep = Dependent(
            customer_id=test_customer.id,
            agency_id=test_customer.agency_id,
            name="Spouse",
            relationship="spouse",
        )
        db.add(dep)
        db.commit()
        db.refresh(dep)

        resp = client.delete(
            f"/api/v1/customers/{test_customer.id}/dependents/{dep.id}",
            headers=admin_headers,
        )
        assert resp.status_code == 204


# =============================================================================
# KYC Workflow
# =============================================================================
class TestCustomerKYC:
    def test_kyc_verification_creates_note(
        self, client: TestClient, admin_headers: dict, db: Session, test_agency: Agency
    ):
        customer = Customer(
            name="KYC Test",
            phone="+1-555-1111",
            kyc_verified=False,
            agency_id=test_agency.id,
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

        resp = client.patch(
            f"/api/v1/customers/{customer.id}",
            json={"kyc_verified": True, "kyc_verified_at": "2026-01-01T00:00:00Z"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["kyc_verified"] is True

        # Verify KYC note was created
        notes_resp = client.get(
            f"/api/v1/customers/{customer.id}/notes", headers=admin_headers
        )
        kyc_notes = [n for n in notes_resp.json() if n["note_type"] == "kyc"]
        assert len(kyc_notes) == 1
        assert "KYC verification completed" in kyc_notes[0]["content"]


# =============================================================================
# Lead Conversion
# =============================================================================
class TestLeadConversion:
    def test_convert_lead_to_customer(
        self, client: TestClient, admin_headers: dict, db: Session, test_agency: Agency
    ):
        lead = Lead(
            name="Convert Me",
            phone="+1-555-2222",
            email="convert@example.com",
            insurance_type="home",
            status=LeadStatus.QUALIFIED,
            agency_id=test_agency.id,
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)

        resp = client.post(
            f"/api/v1/leads/{lead.id}/convert",
            headers=admin_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Convert Me"
        assert data["lead_id"] == lead.id
        assert data["kyc_verified"] is False

        # Lead should now be converted
        from sqlalchemy import select as sa_select

        updated_lead = db.execute(sa_select(Lead).where(Lead.id == lead.id)).scalar_one()
        assert updated_lead.status == LeadStatus.CONVERTED

        # Verify conversion note exists
        notes_resp = client.get(
            f"/api/v1/customers/{data['id']}/notes", headers=admin_headers
        )
        system_notes = [n for n in notes_resp.json() if n["note_type"] == "system"]
        assert len(system_notes) == 1
