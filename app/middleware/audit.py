"""Audit middleware — captures request metadata for sensitive operations.

This middleware is lightweight: it only stores the IP address and user
agent in ``request.state`` so that route handlers can pass them to
``log_action()`` without parsing headers themselves.

Why not log everything here?
- We don't know at the middleware layer whether the request will succeed.
- Logging failed requests as audit events creates noise.
- The route/service layer decides what constitutes a significant action.
"""
from __future__ import annotations

from typing import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class AuditContextMiddleware(BaseHTTPMiddleware):
    """Capture client metadata for downstream audit logging."""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        client = request.client
        request.state.client_ip = client.host if client else None
        request.state.user_agent = request.headers.get("user-agent", "")

        # Forwarded-For handling (when behind Nginx / load balancer)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # First IP in the chain is the original client
            request.state.client_ip = forwarded_for.split(",")[0].strip()

        return await call_next(request)
