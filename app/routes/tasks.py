"""Task management."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.task import Task, TaskStatus, TaskType
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate
from app.services.task_validation import assert_related_in_agency
from app.utils.pagination import (
    PaginationParams,
    build_page,
    paginate,
    pagination_params,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=PaginatedResponse[TaskOut])
def list_tasks(
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    type_filter: TaskType | None = Query(default=None, alias="type"),
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedResponse[TaskOut]:
    stmt = select(Task).where(Task.agency_id == current_user.agency_id)
    if status_filter is not None:
        stmt = stmt.where(Task.status == status_filter)
    if type_filter is not None:
        stmt = stmt.where(Task.type == type_filter)
    stmt = stmt.order_by(Task.due_date.asc())
    rows, total = paginate(db, stmt, params)
    return build_page([TaskOut.model_validate(r) for r in rows], total, params)


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskOut:
    assert_related_in_agency(
        db,
        agency_id=current_user.agency_id,
        task_type=payload.type,
        related_id=payload.related_id,
    )
    task = Task(
        **payload.model_dump(),
        agency_id=current_user.agency_id,
        status=TaskStatus.PENDING,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskOut.model_validate(task)


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskOut:
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.agency_id == current_user.agency_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskOut.model_validate(task)


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskOut:
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.agency_id == current_user.agency_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return TaskOut.model_validate(task)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.agency_id == current_user.agency_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
