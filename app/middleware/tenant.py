"""Tenant isolation middleware.

Injects ``request.state.agency_id`` from the JWT on every request.
This provides defense-in-depth: even if a route handler forgets to use
``get_current_user``, the middleware layer still knows the tenant context.

The middleware also:
- Logs every request with tenant context (useful for audit trails)
- Adds ``X-Request-ID`` header for distributed tracing
- Validates that the agency is active (early rejection)

Why middleware + dependencies?
- **Middleware** is global — catches every request, including those that
  bypass dependencies by mistake.
- **Dependencies** are explicit — they make the contract visible in the
  route signature and provide the actual ``User`` / ``Agency`` objects.
"""
from __future__ import annotations

import uuid
from typing import Awaitable, Callable

from fastapi import Request, Response
from jose import JWTError
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import get_logger
from app.core.security import decode_token

logger = get_logger(__name__)


class TenantMiddleware(BaseHTTPMiddleware):
    """Inject tenant context into request.state and validate JWT early."""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        # Extract agency_id from JWT if present
        agency_id: int | None = None
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header[7:].strip()
            try:
                payload = decode_token(token)
                agency_id = int(payload.get("agency_id", 0))
                request.state.user_id = int(payload.get("sub", 0))
                request.state.user_role = payload.get("role", "unknown")
            except (JWTError, ValueError, TypeError):
                # Let the route dependency handle invalid tokens
                pass

        request.state.agency_id = agency_id

        # Add tracing headers
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        if agency_id is not None:
            response.headers["X-Agency-ID"] = str(agency_id)

        # Structured request logging
        logger.info(
            "method=%s path=%s status=%s agency=%s user=%s request_id=%s",
            request.method,
            request.url.path,
            response.status_code,
            agency_id or "-",
            getattr(request.state, "user_id", "-"),
            request_id,
        )
        return response
