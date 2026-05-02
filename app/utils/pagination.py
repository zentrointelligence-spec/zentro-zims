"""Pagination helpers."""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from fastapi import Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy.sql import Select

from app.schemas.common import PaginatedResponse


@dataclass
class PaginationParams:
    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def pagination_params(
    page: int = Query(1, ge=1, description="1-indexed page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page (max 100)"),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


def paginate(
    db: Session,
    stmt: Select[Any],
    params: PaginationParams,
) -> tuple[list[Any], int]:
    """Execute a SELECT with pagination + return (items, total)."""
    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total: int = db.execute(count_stmt).scalar_one()

    rows = (
        db.execute(stmt.limit(params.page_size).offset(params.offset))
        .scalars()
        .all()
    )
    return list(rows), total


def build_page(
    items: list[Any],
    total: int,
    params: PaginationParams,
) -> PaginatedResponse:
    pages = math.ceil(total / params.page_size) if params.page_size else 0
    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=pages,
    )
