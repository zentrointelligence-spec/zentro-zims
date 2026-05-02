"""Analytics summary response models."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class LeadStatusCounts(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    new: int = 0
    contacted: int = 0
    qualified: int = 0
    converted: int = 0
    lost: int = 0


class LeadsSummary(BaseModel):
    total: int
    by_status: LeadStatusCounts
    conversion_rate: float


class CustomersSummary(BaseModel):
    total: int


class PolicyStatusCounts(BaseModel):
    active: int = 0
    expired: int = 0
    renewal_due: int = 0
    cancelled: int = 0


class PoliciesSummary(BaseModel):
    total: int
    by_status: PolicyStatusCounts
    total_premium_value: float


class TasksSummary(BaseModel):
    total: int
    pending: int
    overdue: int


class AgentSummary(BaseModel):
    """Per-user productivity snapshot (requires creator fields on source models)."""

    user_id: int
    name: str
    leads_created: int = 0
    policies_created: int = 0
    tasks_completed: int = 0


class AnalyticsSummaryResponse(BaseModel):
    leads: LeadsSummary
    customers: CustomersSummary
    policies: PoliciesSummary
    tasks: TasksSummary
    renewals_due_this_month: int
    expired_this_month: int
    agents: list[AgentSummary] = Field(default_factory=list)


class AnalyticsMonthlyRow(BaseModel):
    month: str
    leads_created: int
    policies_created: int
    revenue: float
