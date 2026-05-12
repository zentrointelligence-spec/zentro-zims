"""Agency (tenant) repository."""
from __future__ import annotations

from app.models.agency import Agency
from app.repositories.base import BaseRepository


class AgencyRepository(BaseRepository[Agency]):
    """Data access layer for agencies.

    Design note:
    Agencies are the root tenant object. Soft-delete is supported but
    should be used carefully because cascading deletes affect all child
    entities (users, customers, policies, etc.).
    """

    model = Agency

    def get_by_name(self, name: str, include_deleted: bool = False) -> Agency | None:
        """Lookup by exact name match."""
        return self.get_by(name=name, include_deleted=include_deleted)
