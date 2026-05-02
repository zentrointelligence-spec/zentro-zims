"""FastAPI routers."""
from fastapi import APIRouter

from app.routes import (
    agencies,
    agency_settings,
    ai_content,
    analytics,
    audit_logs,
    auth,
    broadcasts,
    customers,
    dependents,
    documents,
    interactions,
    leads,
    policies,
    quotes,
    tasks,
    users,
    webhooks,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(agencies.router)
api_router.include_router(agency_settings.router)
api_router.include_router(analytics.router)
api_router.include_router(broadcasts.router)
api_router.include_router(ai_content.router)
api_router.include_router(audit_logs.router)
api_router.include_router(leads.router)
api_router.include_router(customers.router)
api_router.include_router(dependents.router)
api_router.include_router(documents.router)
api_router.include_router(quotes.router)
api_router.include_router(policies.router)
api_router.include_router(tasks.router)
api_router.include_router(interactions.router)
api_router.include_router(webhooks.router)

__all__ = ["api_router"]
