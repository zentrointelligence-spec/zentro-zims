"""Auth routes: register agency+admin and login."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.agency import Agency
from app.models.user import User, UserRole
from app.schemas.agency import AgencyOut
from app.schemas.auth import LoginRequest, RegisterRequest, RegisterResponse, Token
from app.schemas.user import UserOut
from app.services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new agency + its first admin",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    if db.query(Agency).filter(Agency.name == payload.agency_name).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Agency with that name already exists",
        )
    if db.query(User).filter(User.email == payload.admin_email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with that email already exists",
        )

    agency = Agency(
        name=payload.agency_name,
        subscription_plan=payload.subscription_plan,
    )
    db.add(agency)
    db.flush()  # populate agency.id

    admin = User(
        name=payload.admin_name,
        email=payload.admin_email.lower(),
        hashed_password=hash_password(payload.admin_password),
        role=UserRole.ADMIN,
        is_active=True,
        agency_id=agency.id,
    )
    db.add(admin)
    db.commit()
    db.refresh(agency)
    db.refresh(admin)

    token = create_access_token(
        subject=admin.id, agency_id=admin.agency_id, role=admin.role.value
    )
    return RegisterResponse(
        agency=AgencyOut.model_validate(agency),
        user=UserOut.model_validate(admin),
        access_token=token,
    )


@router.post("/login", response_model=Token, summary="Log in with email + password")
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> Token:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User is disabled"
        )

    token = create_access_token(
        subject=user.id, agency_id=user.agency_id, role=user.role.value
    )
    client = request.client
    log_action(
        db,
        user,
        "login",
        "user",
        user.id,
        f"User login: {user.email}",
        ip_address=client.host if client else None,
    )
    return Token(access_token=token, user=UserOut.model_validate(user))
