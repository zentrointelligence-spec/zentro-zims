"""Lead service — business logic for the CRM funnel.

This layer owns:
- CRUD with tenant scoping and audit logging
- Status transitions with automatic note creation
- Agent assignment with validation
- Bulk import validation (preparation hooks)
- AI lead scoring placeholder
- WhatsApp integration placeholder

Why a service layer for leads?
1. **Complex state machines**: status transitions should emit timeline notes
   and trigger automations — too much logic for route handlers.
2. **Reusability**: the import pipeline (LeadRadar, Excel, API) all call
   the same ``create_lead`` logic.
3. **Testability**: we can unit-test status transitions and bulk validation
   without HTTP overhead.
"""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.lead import Lead, LeadNote, LeadStatus
from app.models.user import User
from app.repositories.lead import LeadNoteRepository, LeadRepository
from app.schemas.lead import (
    LeadBulkItem,
    LeadBulkPreview,
    LeadCreate,
    LeadStatusUpdateRequest,
    LeadUpdate,
)
from app.services.audit_service import log_action

logger = get_logger(__name__)


class LeadService:
    """Lead management service — scoped to a single agency."""

    def __init__(self, db: Session, agency_id: int) -> None:
        self._db = db
        self._agency_id = agency_id
        self._repo = LeadRepository(db)
        self._note_repo = LeadNoteRepository(db)

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------
    def get(self, lead_id: int) -> Lead | None:
        """Fetch a lead with notes eagerly loaded."""
        return self._repo.get_with_notes(lead_id, self._agency_id)

    def get_or_404(self, lead_id: int) -> Lead:
        lead = self.get(lead_id)
        if lead is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead not found",
            )
        return lead

    def list(
        self,
        *,
        status: LeadStatus | None = None,
        search: str | None = None,
        tags: list[str] | None = None,
        assigned_user_id: int | None = None,
        source: str | None = None,
        min_score: float | None = None,
        max_score: float | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Lead], int]:
        """List leads with full filter support and offset pagination."""
        return self._repo.list_with_filters(
            agency_id=self._agency_id,
            status=status,
            search=search,
            tags=tags,
            assigned_user_id=assigned_user_id,
            source=source,
            min_score=min_score,
            max_score=max_score,
            date_from=date_from,
            date_to=date_to,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )

    def list_cursor(
        self,
        *,
        cursor: int | None = None,
        page_size: int = 20,
        status: LeadStatus | None = None,
        search: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[Lead], int | None]:
        """Cursor-based pagination for infinite scroll."""
        return self._repo.list_with_cursor(
            agency_id=self._agency_id,
            cursor=cursor,
            page_size=page_size,
            status=status,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
        )

    def kanban_summary(self, limit_per_column: int = 10) -> dict[str, dict[str, Any]]:
        """Return leads grouped by status for Kanban boards."""
        return self._repo.kanban_summary(self._agency_id, limit_per_column)

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------
    def create(self, payload: LeadCreate, actor: User) -> Lead:
        """Create a new lead."""
        lead = Lead(
            name=payload.name,
            phone=payload.phone,
            email=payload.email,
            insurance_type=payload.insurance_type,
            status=payload.status,
            source=payload.source,
            notes=payload.notes,
            tags=payload.tags,
            assigned_user_id=payload.assigned_user_id,
            lead_score=payload.lead_score,
            estimated_value=payload.estimated_value,
            whatsapp_opt_in=payload.whatsapp_opt_in,
            agency_id=self._agency_id,
        )
        self._repo.create(lead)
        self._db.commit()
        self._db.refresh(lead)

        log_action(
            self._db,
            actor,
            "create_lead",
            "lead",
            lead.id,
            f"Created lead: {lead.name}",
        )
        return lead

    def update(self, lead_id: int, payload: LeadUpdate, actor: User) -> Lead:
        """Update an existing lead.

        If status changes, automatically creates a timeline note.
        """
        lead = self.get_or_404(lead_id)
        old_status = lead.status

        data = payload.model_dump(exclude_unset=True)
        status_changed = False

        if "status" in data and data["status"] != old_status:
            status_changed = True
            old_status_val = old_status.value if old_status else None
            new_status_val = data["status"].value if hasattr(data["status"], "value") else data["status"]

        self._repo.update(lead, **data)
        self._db.commit()
        self._db.refresh(lead)

        # Auto-create timeline note on status change
        if status_changed:
            note = LeadNote(
                lead_id=lead.id,
                content=f"Status changed from '{old_status_val}' to '{new_status_val}'",
                note_type="status_change",
                extra_data={"old_status": old_status_val, "new_status": new_status_val},
                created_by_id=actor.id,
                agency_id=self._agency_id,
            )
            self._note_repo.create(note)
            self._db.commit()

        log_action(
            self._db,
            actor,
            "update_lead",
            "lead",
            lead.id,
            f"Updated lead: {lead.name}",
            old_value={"status": old_status.value} if status_changed else None,
            new_value={"status": lead.status.value} if status_changed else None,
        )
        return lead

    def soft_delete(self, lead_id: int, actor: User) -> None:
        """Soft-delete a lead."""
        lead = self.get_or_404(lead_id)
        self._repo.soft_delete(lead)
        self._db.commit()

        log_action(
            self._db,
            actor,
            "delete_lead",
            "lead",
            lead.id,
            f"Soft-deleted lead: {lead.name}",
        )

    def assign(self, lead_id: int, assigned_user_id: int | None, actor: User) -> Lead:
        """Assign or unassign a lead to an agent."""
        lead = self.get_or_404(lead_id)
        old_assignee = lead.assigned_user_id

        lead.assigned_user_id = assigned_user_id
        lead.updated_at = datetime.now(tz=timezone.utc)
        self._db.commit()
        self._db.refresh(lead)

        action = "unassigned" if assigned_user_id is None else "assigned"
        note = LeadNote(
            lead_id=lead.id,
            content=f"Lead {action} to agent ID {assigned_user_id}",
            note_type="system",
            extra_data={"old_assignee": old_assignee, "new_assignee": assigned_user_id},
            created_by_id=actor.id,
            agency_id=self._agency_id,
        )
        self._note_repo.create(note)
        self._db.commit()

        log_action(
            self._db,
            actor,
            "assign_lead",
            "lead",
            lead.id,
            f"Lead {action}: {lead.name}",
        )
        return lead

    def update_status(
        self, lead_id: int, payload: LeadStatusUpdateRequest, actor: User
    ) -> Lead:
        """Dedicated status transition endpoint with validation and note."""
        lead = self.get_or_404(lead_id)
        old_status = lead.status
        new_status = payload.status

        if old_status == new_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Lead is already '{new_status.value}'",
            )

        lead.status = new_status
        lead.updated_at = datetime.now(tz=timezone.utc)
        if new_status in (LeadStatus.CONVERTED, LeadStatus.LOST):
            lead.last_contact_at = datetime.now(tz=timezone.utc)

        self._db.commit()
        self._db.refresh(lead)

        note_content = f"Status changed from '{old_status.value}' to '{new_status.value}'"
        if payload.note:
            note_content += f"\nReason: {payload.note}"

        note = LeadNote(
            lead_id=lead.id,
            content=note_content,
            note_type="status_change",
            extra_data={"old_status": old_status.value, "new_status": new_status.value},
            created_by_id=actor.id,
            agency_id=self._agency_id,
        )
        self._note_repo.create(note)
        self._db.commit()

        log_action(
            self._db,
            actor,
            "status_change",
            "lead",
            lead.id,
            note_content,
        )
        return lead

    # ------------------------------------------------------------------
    # Notes
    # ------------------------------------------------------------------
    def add_note(
        self,
        lead_id: int,
        content: str,
        note_type: str,
        extra_data: dict | None,
        actor: User,
    ) -> LeadNote:
        """Add a timeline note to a lead."""
        lead = self.get_or_404(lead_id)
        note = LeadNote(
            lead_id=lead.id,
            content=content,
            note_type=note_type,
            extra_data=extra_data,
            created_by_id=actor.id,
            agency_id=self._agency_id,
        )
        self._note_repo.create(note)

        # Update last_contact_at
        lead.last_contact_at = datetime.now(tz=timezone.utc)
        self._db.commit()
        self._db.refresh(note)

        log_action(
            self._db,
            actor,
            "add_note",
            "lead_note",
            note.id,
            f"Added {note_type} note to lead {lead.name}",
        )
        return note

    def list_notes(self, lead_id: int) -> list[LeadNote]:
        """List all notes for a lead."""
        self.get_or_404(lead_id)  # verify access
        return self._note_repo.list_for_lead(lead_id, self._agency_id)

    # ------------------------------------------------------------------
    # Bulk import (preparation hooks)
    # ------------------------------------------------------------------
    def bulk_preview(self, items: list[LeadBulkItem]) -> LeadBulkPreview:
        """Validate a batch of leads without persisting.

        Returns a preview with per-row validation errors. This is the
        "dry run" step before actual bulk creation.
        """
        errors: list[dict[str, str]] = []
        preview: list[Lead] = []
        valid = 0

        for idx, item in enumerate(items, start=1):
            row_errors = self._validate_bulk_item(item)
            if row_errors:
                for err in row_errors:
                    errors.append({"row": str(idx), "field": err["field"], "message": err["message"]})
            else:
                valid += 1
                if len(preview) < 5:
                    # Construct a transient Lead for preview (not persisted)
                    preview.append(
                        Lead(
                            name=item.name,
                            phone=item.phone,
                            email=item.email,
                            insurance_type=item.insurance_type,
                            source=item.source,
                            status=item.status,
                            tags=item.tags,
                            notes=item.notes,
                            agency_id=self._agency_id,
                        )
                    )

        return LeadBulkPreview(
            total=len(items),
            valid=valid,
            invalid=len(items) - valid,
            errors=errors,
            preview=preview,
        )

    def _validate_bulk_item(self, item: LeadBulkItem) -> list[dict[str, str]]:
        """Validate a single bulk item. Returns list of error dicts."""
        errs: list[dict[str, str]] = []
        if not item.name or len(item.name) < 1:
            errs.append({"field": "name", "message": "Name is required"})
        if not item.phone or len(item.phone) < 5:
            errs.append({"field": "phone", "message": "Phone must be at least 5 characters"})
        return errs

    # ------------------------------------------------------------------
    # AI lead scoring placeholder
    # ------------------------------------------------------------------
    def calculate_ai_score(self, lead_id: int) -> dict[str, Any]:
        """Placeholder for AI lead scoring.

        Phase 3 will replace this with an actual OpenAI call that analyses
        the lead's profile, source, interaction history, and market data.

        For now, returns a deterministic heuristic based on source quality
        and contact completeness.
        """
        lead = self.get_or_404(lead_id)
        score = 50.0
        reasons: list[str] = ["Base score"]

        if lead.email:
            score += 15
            reasons.append("Has email")
        if lead.source and lead.source.lower() in {"referral", "website", "organic"}:
            score += 20
            reasons.append(f"High-quality source: {lead.source}")
        if lead.whatsapp_opt_in:
            score += 10
            reasons.append("WhatsApp opt-in")
        if lead.estimated_value and lead.estimated_value > 1000:
            score += 10
            reasons.append("High estimated value")

        score = min(100.0, max(0.0, score))

        # Persist the score
        lead.lead_score = Decimal(str(round(score, 2)))
        self._db.commit()

        return {
            "lead_id": lead.id,
            "score": round(score, 2),
            "reasons": reasons,
            "model": "heuristic_v1",
            "calculated_at": datetime.now(tz=timezone.utc).isoformat(),
        }

    # ------------------------------------------------------------------
    # WhatsApp integration placeholder
    # ------------------------------------------------------------------
    def send_whatsapp_message(
        self,
        lead_id: int,
        message: str,
        template_name: str | None = None,
    ) -> dict[str, Any]:
        """Placeholder for WhatsApp message sending via Twilio.

        Phase 2 will integrate the actual Twilio client. For now, this:
        1. Validates the lead has opted in
        2. Creates a timeline note
        3. Returns a mock delivery receipt
        """
        lead = self.get_or_404(lead_id)
        if not lead.whatsapp_opt_in:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lead has not opted in to WhatsApp messaging",
            )

        # Create timeline note
        note = LeadNote(
            lead_id=lead.id,
            content=f"WhatsApp message sent: {message[:200]}",
            note_type="whatsapp",
            extra_data={
                "message_preview": message[:200],
                "template_name": template_name,
                "status": "mock_delivered",
            },
            agency_id=self._agency_id,
        )
        self._note_repo.create(note)
        lead.last_contact_at = datetime.now(tz=timezone.utc)
        self._db.commit()

        return {
            "lead_id": lead.id,
            "message_id": f"mock_{lead.id}_{datetime.now(tz=timezone.utc).timestamp()}",
            "status": "delivered",
            "channel": "whatsapp",
            "template": template_name,
            "sent_at": datetime.now(tz=timezone.utc).isoformat(),
        }
