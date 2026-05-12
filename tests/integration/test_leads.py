"""Integration tests for the Leads module.

Tests cover:
- CRUD with tenant isolation
- Search and filtering
- Soft deletes
- Status transitions with auto-notes
- Agent assignment
- Notes timeline
- Kanban API
- Bulk validation
- AI scoring placeholder
- Cross-tenant isolation
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.agency import Agency
from app.models.lead import Lead, LeadNote, LeadStatus
from app.models.user import User, UserRole


# =============================================================================
# Fixtures
# =============================================================================
@pytest.fixture(scope="function")
def test_lead(db: Session, test_agency: Agency, test_agent: User) -> Lead:
    """Create a standard test lead."""
    lead = Lead(
        name="Jane Prospect",
        phone="+1-555-9999",
        email="jane@example.com",
        insurance_type="home",
        status=LeadStatus.NEW,
        source="website",
        tags=["hot", "referral"],
        agency_id=test_agency.id,
        assigned_user_id=test_agent.id,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@pytest.fixture(scope="function")
def other_agency_lead(db: Session) -> Lead:
    """Create a lead in a different agency for isolation testing."""
    agency = Agency(name="Other Agency")
    db.add(agency)
    db.flush()
    user = User(
        name="Other Admin",
        email="other@test.com",
        hashed_password=hash_password("pass"),
        role=UserRole.AGENCY_ADMIN,
        agency_id=agency.id,
    )
    db.add(user)
    db.flush()
    lead = Lead(
        name="Other Lead",
        phone="+1-555-0000",
        insurance_type="auto",
        status=LeadStatus.NEW,
        agency_id=agency.id,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


# =============================================================================
# CRUD
# =============================================================================
class TestLeadCRUD:
    def test_create_lead(self, client: TestClient, admin_headers: dict):
        payload = {
            "name": "New Prospect",
            "phone": "+1-555-1234",
            "email": "new@example.com",
            "insurance_type": "life",
            "source": "facebook",
            "tags": ["warm"],
        }
        resp = client.post("/api/v1/leads", json=payload, headers=admin_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "New Prospect"
        assert data["status"] == "new"
        assert data["tags"] == ["warm"]
        assert data["agency_id"] == 1

    def test_get_lead(self, client: TestClient, admin_headers: dict, test_lead: Lead):
        resp = client.get(f"/api/v1/leads/{test_lead.id}", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Jane Prospect"
        assert data["lead_notes"] == []  # no notes yet

    def test_update_lead(self, client: TestClient, admin_headers: dict, test_lead: Lead):
        resp = client.patch(
            f"/api/v1/leads/{test_lead.id}",
            json={"name": "Jane Updated", "notes": "Follow up next week"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Jane Updated"
        assert resp.json()["notes"] == "Follow up next week"

    def test_soft_delete_lead(self, client: TestClient, admin_headers: dict, test_lead: Lead):
        resp = client.delete(f"/api/v1/leads/{test_lead.id}", headers=admin_headers)
        assert resp.status_code == 204

        # Should no longer appear in list
        resp = client.get("/api/v1/leads", headers=admin_headers)
        assert resp.status_code == 200
        ids = [l["id"] for l in resp.json()["items"]]
        assert test_lead.id not in ids

    def test_cross_tenant_lead_not_visible(
        self, client: TestClient, admin_headers: dict, other_agency_lead: Lead
    ):
        resp = client.get(f"/api/v1/leads/{other_agency_lead.id}", headers=admin_headers)
        assert resp.status_code == 404


# =============================================================================
# Search & Filters
# =============================================================================
class TestLeadSearch:
    def test_search_by_name(self, client: TestClient, admin_headers: dict, test_lead: Lead):
        resp = client.get("/api/v1/leads?search=Jane", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()["items"]) == 1
        assert resp.json()["items"][0]["name"] == "Jane Prospect"

    def test_search_by_phone(self, client: TestClient, admin_headers: dict, test_lead: Lead):
        resp = client.get("/api/v1/leads?search=9999", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()["items"]) == 1

    def test_filter_by_status(self, client: TestClient, admin_headers: dict, test_lead: Lead):
        resp = client.get("/api/v1/leads?status=new", headers=admin_headers)
        assert resp.status_code == 200
        assert all(l["status"] == "new" for l in resp.json()["items"])

    def test_filter_by_assigned_user(
        self, client: TestClient, admin_headers: dict, test_lead: Lead, test_agent: User
    ):
        resp = client.get(
            f"/api/v1/leads?assigned_user_id={test_agent.id}",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert len(resp.json()["items"]) == 1

    def test_sort_by_score(self, client: TestClient, admin_headers: dict, db: Session, test_agency: Agency):
        # Create leads with different scores
        for name, score in [("Low", 10.0), ("High", 90.0)]:
            db.add(Lead(
                name=name, phone="+1-555-0000", insurance_type="auto",
                lead_score=score, agency_id=test_agency.id,
            ))
        db.commit()

        resp = client.get("/api/v1/leads?sort_by=lead_score&sort_order=desc", headers=admin_headers)
        assert resp.status_code == 200
        names = [l["name"] for l in resp.json()["items"]]
        assert names.index("High") < names.index("Low")


# =============================================================================
# Status Transitions
# =============================================================================
class TestLeadStatus:
    def test_status_change_creates_note(
        self, client: TestClient, admin_headers: dict, test_lead: Lead
    ):
        resp = client.post(
            f"/api/v1/leads/{test_lead.id}/status",
            json={"status": "qualified", "note": "Met at conference"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "qualified"

        # Verify timeline note was created
        resp = client.get(f"/api/v1/leads/{test_lead.id}/notes", headers=admin_headers)
        assert resp.status_code == 200
        notes = resp.json()
        assert len(notes) == 1
        assert "qualified" in notes[0]["content"]
        assert notes[0]["note_type"] == "status_change"

    def test_same_status_rejected(self, client: TestClient, admin_headers: dict, test_lead: Lead):
        resp = client.post(
            f"/api/v1/leads/{test_lead.id}/status",
            json={"status": "new"},
            headers=admin_headers,
        )
        assert resp.status_code == 400


# =============================================================================
# Assignment
# =============================================================================
class TestLeadAssignment:
    def test_assign_agent(self, client: TestClient, admin_headers: dict, test_lead: Lead, test_agent: User):
        resp = client.post(
            f"/api/v1/leads/{test_lead.id}/assign",
            json={"assigned_user_id": test_agent.id},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["assigned_user_id"] == test_agent.id

    def test_unassign_agent(self, client: TestClient, admin_headers: dict, test_lead: Lead):
        resp = client.post(
            f"/api/v1/leads/{test_lead.id}/assign",
            json={"assigned_user_id": None},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["assigned_user_id"] is None


# =============================================================================
# Notes Timeline
# =============================================================================
class TestLeadNotes:
    def test_add_note(self, client: TestClient, admin_headers: dict, test_lead: Lead):
        resp = client.post(
            f"/api/v1/leads/{test_lead.id}/notes",
            json={
                "content": "Called prospect, left voicemail",
                "note_type": "call",
                "extra_data": {"duration_minutes": 5},
            },
            headers=admin_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == "Called prospect, left voicemail"
        assert data["note_type"] == "call"
        assert data["extra_data"]["duration_minutes"] == 5

    def test_notes_ordered_newest_first(
        self, client: TestClient, admin_headers: dict, test_lead: Lead
    ):
        for i in range(3):
            client.post(
                f"/api/v1/leads/{test_lead.id}/notes",
                json={"content": f"Note {i}", "note_type": "general"},
                headers=admin_headers,
            )
        resp = client.get(f"/api/v1/leads/{test_lead.id}/notes", headers=admin_headers)
        assert resp.status_code == 200
        contents = [n["content"] for n in resp.json()]
        assert contents == ["Note 2", "Note 1", "Note 0"]


# =============================================================================
# Kanban
# =============================================================================
class TestLeadKanban:
    def test_kanban_returns_all_columns(
        self, client: TestClient, admin_headers: dict, test_lead: Lead
    ):
        resp = client.get("/api/v1/leads/kanban", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["columns"]) == 6  # all LeadStatus values
        statuses = [c["status"] for c in data["columns"]]
        assert "new" in statuses
        assert "proposal_sent" in statuses

    def test_kanban_counts_correct(
        self, client: TestClient, admin_headers: dict, test_lead: Lead
    ):
        resp = client.get("/api/v1/leads/kanban", headers=admin_headers)
        new_col = next(c for c in resp.json()["columns"] if c["status"] == "new")
        assert new_col["count"] >= 1


# =============================================================================
# Bulk Operations
# =============================================================================
class TestLeadBulk:
    def test_bulk_preview_valid(self, client: TestClient, admin_headers: dict):
        items = [
            {"name": "Bulk 1", "phone": "+1-555-1111"},
            {"name": "Bulk 2", "phone": "+1-555-2222"},
        ]
        resp = client.post("/api/v1/leads/bulk/preview", json=items, headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert data["valid"] == 2
        assert data["invalid"] == 0
        assert len(data["preview"]) == 2

    def test_bulk_preview_with_errors(self, client: TestClient, admin_headers: dict):
        items = [
            {"name": "Valid", "phone": "+1-555-1111"},
            {"name": "", "phone": "+1-555-2222"},  # invalid name
            {"name": "Short", "phone": "123"},  # invalid phone
        ]
        resp = client.post("/api/v1/leads/bulk/preview", json=items, headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3
        assert data["valid"] == 1
        assert data["invalid"] == 2
        assert len(data["errors"]) == 2


# =============================================================================
# AI Scoring Placeholder
# =============================================================================
class TestLeadAIScoring:
    def test_calculate_score(self, client: TestClient, admin_headers: dict, test_lead: Lead):
        resp = client.post(
            f"/api/v1/leads/{test_lead.id}/score",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "score" in data
        assert 0 <= data["score"] <= 100
        assert "reasons" in data
        assert data["model"] == "heuristic_v1"


# =============================================================================
# WhatsApp Placeholder
# =============================================================================
class TestLeadWhatsApp:
    def test_whatsapp_requires_opt_in(
        self, client: TestClient, admin_headers: dict, test_lead: Lead
    ):
        resp = client.post(
            f"/api/v1/leads/{test_lead.id}/whatsapp?message=Hello",
            headers=admin_headers,
        )
        assert resp.status_code == 400
        assert "opted in" in resp.json()["detail"].lower()

    def test_whatsapp_with_opt_in(
        self, client: TestClient, admin_headers: dict, db: Session, test_lead: Lead
    ):
        test_lead.whatsapp_opt_in = True
        db.commit()
        resp = client.post(
            f"/api/v1/leads/{test_lead.id}/whatsapp?message=Hello there",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "delivered"
        assert resp.json()["channel"] == "whatsapp"

        # Verify timeline note was created
        notes_resp = client.get(
            f"/api/v1/leads/{test_lead.id}/notes", headers=admin_headers
        )
        whatsapp_notes = [n for n in notes_resp.json() if n["note_type"] == "whatsapp"]
        assert len(whatsapp_notes) == 1
