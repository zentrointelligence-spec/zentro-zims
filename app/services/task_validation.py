"""Validate task.related_id belongs to the same agency."""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.lead import Lead
from app.models.policy import Policy
from app.models.task import TaskType


def assert_related_in_agency(
    db: Session,
    *,
    agency_id: int,
    task_type: TaskType,
    related_id: int | None,
) -> None:
    """Raise 422 if related_id is set but does not reference a row in this agency."""
    if related_id is None:
        return

    if task_type == TaskType.RENEWAL:
        row = (
            db.query(Policy.id)
            .filter(Policy.id == related_id, Policy.agency_id == agency_id)
            .first()
        )
        if not row:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="related_id must be a policy id in your agency for renewal tasks",
            )
        return

    if task_type in (TaskType.FOLLOWUP, TaskType.CALL):
        row = (
            db.query(Lead.id)
            .filter(Lead.id == related_id, Lead.agency_id == agency_id)
            .first()
        )
        if not row:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="related_id must be a lead id in your agency for this task type",
            )
        return

    # OTHER — allow lead or policy in agency
    if (
        db.query(Lead.id)
        .filter(Lead.id == related_id, Lead.agency_id == agency_id)
        .first()
    ):
        return
    if (
        db.query(Policy.id)
        .filter(Policy.id == related_id, Policy.agency_id == agency_id)
        .first()
    ):
        return
    if (
        db.query(Customer.id)
        .filter(Customer.id == related_id, Customer.agency_id == agency_id)
        .first()
    ):
        return
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="related_id must reference a lead, policy, or customer in your agency",
    )
