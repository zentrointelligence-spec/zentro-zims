"""Document uploads (multipart) — local disk storage."""
from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.customer import Customer
from app.models.document import Document
from app.models.policy import Policy
from app.models.quote import Quote
from app.models.user import User
from app.schemas.document import DocumentResponse

router = APIRouter(tags=["documents"])

_ALLOWED_EXT = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"}
_CT_EXT = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}


def _ext_for_upload(filename: str, content_type: str | None) -> str:
    suf = Path(filename or "").suffix.lower()
    if suf in _ALLOWED_EXT:
        return suf
    if content_type:
        ct = content_type.split(";")[0].strip().lower()
        if ct in _CT_EXT:
            return _CT_EXT[ct]
    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail=f"Allowed types: {', '.join(sorted(_ALLOWED_EXT))}",
    )


def _assert_related_in_agency(
    db: Session,
    *,
    related_type: str,
    related_id: int,
    agency_id: int,
) -> None:
    rt = related_type.strip().lower()
    if rt == "customer":
        ok = (
            db.query(Customer.id)
            .filter(Customer.id == related_id, Customer.agency_id == agency_id)
            .first()
        )
        if not ok:
            raise HTTPException(status_code=404, detail="Customer not found")
        return
    if rt == "policy":
        ok = (
            db.query(Policy.id)
            .filter(Policy.id == related_id, Policy.agency_id == agency_id)
            .first()
        )
        if not ok:
            raise HTTPException(status_code=404, detail="Policy not found")
        return
    if rt == "quote":
        ok = (
            db.query(Quote.id)
            .filter(Quote.id == related_id, Quote.agency_id == agency_id)
            .first()
        )
        if not ok:
            raise HTTPException(status_code=404, detail="Quote not found")
        return
    raise HTTPException(
        status_code=422,
        detail="related_type must be one of: policy, customer, quote",
    )


@router.post(
    "/documents/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(...),
    related_type: str = Form(...),
    related_id: int = Form(..., gt=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    aid = current_user.agency_id
    rt = related_type.strip().lower()
    _assert_related_in_agency(db, related_type=rt, related_id=related_id, agency_id=aid)

    ext = _ext_for_upload(file.filename or "", file.content_type)
    content = await file.read()
    if len(content) > settings.max_document_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {settings.max_document_size_mb} MB)",
        )

    root = Path(settings.upload_dir).resolve()
    rel_dir = Path(str(aid)) / rt
    dest_dir = root / rel_dir
    dest_dir.mkdir(parents=True, exist_ok=True)

    fname = f"{uuid.uuid4().hex}{ext}"
    abs_path = dest_dir / fname
    abs_path.write_bytes(content)

    rel_path = str(rel_dir / fname)
    orig_name = (file.filename or "upload").strip()[:512] or "upload"
    size_kb = max(1, int(len(content) / 1024)) if len(content) > 0 else 0
    doc = Document(
        agency_id=aid,
        related_type=rt,
        related_id=related_id,
        filename=orig_name,
        file_path=rel_path,
        file_size_kb=size_kb,
        content_type=(file.content_type or "application/octet-stream").split(";")[0].strip()[:255],
        uploaded_by_user_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return DocumentResponse.model_validate(doc)


@router.get("/documents/{document_id}/download")
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    doc = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.agency_id == current_user.agency_id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    root = Path(settings.upload_dir).resolve()
    abs_file = (root / doc.file_path).resolve()
    root_r = root.resolve()
    if not abs_file.is_file() or not abs_file.is_relative_to(root_r):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=str(abs_file),
        filename=doc.filename,
        media_type=doc.content_type or "application/octet-stream",
    )


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    doc = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.agency_id == current_user.agency_id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    root = Path(settings.upload_dir).resolve()
    abs_file = (root / doc.file_path).resolve()
    root_r = root.resolve()
    try:
        if abs_file.is_file() and abs_file.is_relative_to(root_r):
            abs_file.unlink(missing_ok=True)
    except OSError:
        pass

    db.delete(doc)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
