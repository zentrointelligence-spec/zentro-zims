"""User management (scoped to the caller's agency).

All endpoints require authentication. Creation, update, and delete
require admin privileges. List and read are available to any authenticated
user within the same tenant.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.core.logging import get_logger
from app.models.user import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services.audit_service import log_action
from app.services.user_service import UserService
from app.utils.pagination import (
    PaginationParams,
    build_page,
    paginate,
    pagination_params,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)) -> UserOut:
    """Return the current authenticated user's profile."""
    return UserOut.model_validate(current_user)


@router.get("", response_model=PaginatedResponse[UserOut])
def list_users(
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedResponse[UserOut]:
    """List all users in the current agency.

    Results are automatically scoped by ``agency_id`` and exclude
    soft-deleted users.
    """
    from sqlalchemy import select

    stmt = (
        select(User)
        .where(
            User.agency_id == current_user.agency_id,
            User.deleted_at.is_(None),
        )
        .order_by(User.created_at.desc())
    )
    rows, total = paginate(db, stmt, params)
    return build_page([UserOut.model_validate(r) for r in rows], total, params)


@router.post(
    "",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user (admin only)",
)
def create_user(
    payload: UserCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> UserOut:
    """Create a new user within the current agency.

    Enforces role hierarchy: an admin cannot create a user with a higher
    role than their own.
    """
    svc = UserService(db, agency_id=admin.agency_id)
    user = svc.create(payload, actor=admin)
    return UserOut.model_validate(user)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> UserOut:
    """Update an existing user within the agency."""
    svc = UserService(db, agency_id=admin.agency_id)
    user = svc.update(user_id, payload, actor=admin)
    return UserOut.model_validate(user)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Soft-delete a user (admin only)",
)
def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Response:
    """Soft-delete a user. Prevents self-deletion.

    The user row remains in the database with ``deleted_at`` set,
    preserving referential integrity for related records (customers,
    policies, audit logs, etc.).
    """
    svc = UserService(db, agency_id=admin.agency_id)
    svc.soft_delete(user_id, actor=admin)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
