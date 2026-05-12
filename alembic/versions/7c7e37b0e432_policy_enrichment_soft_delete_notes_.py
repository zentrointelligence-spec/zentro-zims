"""Policy enrichment soft delete notes coverage insurer payment renewal

Revision ID: 7c7e37b0e432
Revises: f0a1b2c3d4e5
Create Date: 2026-05-09 21:07:38.261183

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c7e37b0e432'
down_revision: Union[str, None] = 'f0a1b2c3d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ---------------------------------------------------------------------------
# Helpers for cross-db enum + JSON compatibility
# ---------------------------------------------------------------------------
def _add_enum_column(table: str, col: str, enum_name: str, values: tuple[str, ...],
                     nullable: bool = False, default: str | None = None,
                     index: bool = False) -> None:
    """Add an enum column safely for both SQLite and PostgreSQL."""
    dialect = op.get_context().dialect.name
    if dialect == "postgresql":
        enum_type = sa.Enum(*values, name=enum_name)
        kwargs: dict = {"nullable": nullable}
        if default is not None:
            kwargs["server_default"] = default
        op.add_column(table, sa.Column(col, enum_type, **kwargs))
    else:
        kwargs = {"nullable": nullable}
        if default is not None:
            kwargs["server_default"] = sa.text(f"'{default}'")
        op.add_column(table, sa.Column(col, sa.String(32), **kwargs))
    if index:
        op.create_index(op.f(f"ix_{table}_{col}"), table, [col], unique=False)


def _drop_enum_column(table: str, col: str, enum_name: str | None = None) -> None:
    """Drop an enum column and its type (PostgreSQL)."""
    dialect = op.get_context().dialect.name
    op.drop_column(table, col)
    if dialect == "postgresql" and enum_name:
        try:
            op.execute(f"DROP TYPE IF EXISTS {enum_name}")
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Upgrade
# ---------------------------------------------------------------------------
def upgrade() -> None:
    dialect = op.get_context().dialect.name

    # -- policy_notes table (lifecycle timeline)
    op.create_table(
        'policy_notes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('policy_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.String(length=4000), nullable=False),
        sa.Column('note_type', sa.String(length=32), nullable=False, server_default='general'),
        sa.Column('extra_data', sa.JSON(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('agency_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['policy_id'], ['policies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_policy_notes_agency_id'), 'policy_notes', ['agency_id'], unique=False)
    op.create_index(op.f('ix_policy_notes_policy_id'), 'policy_notes', ['policy_id'], unique=False)

    # -- policies: new columns (SQLite supports ADD COLUMN)
    _add_enum_column(
        'policies', 'premium_frequency', 'premium_frequency',
        ('MONTHLY', 'QUARTERLY', 'ANNUALLY'),
        nullable=False, default='ANNUALLY',
    )
    op.add_column('policies', sa.Column('currency', sa.String(length=3),
                  nullable=False, server_default='USD'))
    op.add_column('policies', sa.Column('commission_rate', sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column('policies', sa.Column('commission_amount', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('policies', sa.Column('coverage_details', sa.JSON(), nullable=True))
    op.add_column('policies', sa.Column('insurer_name', sa.String(length=128), nullable=True))
    op.add_column('policies', sa.Column('insurer_code', sa.String(length=32), nullable=True))
    _add_enum_column(
        'policies', 'payment_status', 'payment_status',
        ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED'),
        nullable=False, default='PENDING', index=True,
    )
    op.add_column('policies', sa.Column('renewal_due_date', sa.Date(), nullable=True))
    op.add_column('policies', sa.Column('last_renewal_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('policies', sa.Column('auto_renewal', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('policies', sa.Column('next_reminder_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('policies', sa.Column('renewal_risk_score', sa.Integer(), nullable=True))
    op.add_column('policies', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    # -- policies: indexes (all dialects support CREATE INDEX)
    op.create_index(op.f('ix_policies_deleted_at'), 'policies', ['deleted_at'], unique=False)
    op.create_index(op.f('ix_policies_renewal_due_date'), 'policies', ['renewal_due_date'], unique=False)
    op.drop_index('ix_policies_policy_number', table_name='policies')
    op.create_index(op.f('ix_policies_policy_number'), 'policies', ['policy_number'], unique=False)

    # -- policies: unique constraint (application enforces this on SQLite)
    if dialect == "postgresql":
        op.create_unique_constraint(
            'uq_policies_agency_id_policy_number', 'policies', ['agency_id', 'policy_number']
        )


# ---------------------------------------------------------------------------
# Downgrade
# ---------------------------------------------------------------------------
def downgrade() -> None:
    dialect = op.get_context().dialect.name

    # -- policies: unique constraint
    if dialect == "postgresql":
        op.drop_constraint('uq_policies_agency_id_policy_number', 'policies', type_='unique')

    # -- policies: indexes
    op.drop_index(op.f('ix_policies_policy_number'), table_name='policies')
    op.create_index('ix_policies_policy_number', 'policies', ['policy_number'], unique=1)
    op.drop_index(op.f('ix_policies_renewal_due_date'), table_name='policies')
    op.drop_index(op.f('ix_policies_deleted_at'), table_name='policies')

    # -- policies: drop columns
    op.drop_column('policies', 'deleted_at')
    op.drop_column('policies', 'renewal_risk_score')
    op.drop_column('policies', 'next_reminder_at')
    op.drop_column('policies', 'auto_renewal')
    op.drop_column('policies', 'last_renewal_at')
    op.drop_column('policies', 'renewal_due_date')
    _drop_enum_column('policies', 'payment_status', 'payment_status')
    op.drop_column('policies', 'insurer_code')
    op.drop_column('policies', 'insurer_name')
    op.drop_column('policies', 'coverage_details')
    op.drop_column('policies', 'commission_amount')
    op.drop_column('policies', 'commission_rate')
    op.drop_column('policies', 'currency')
    _drop_enum_column('policies', 'premium_frequency', 'premium_frequency')

    # -- policy_notes table
    op.drop_index(op.f('ix_policy_notes_policy_id'), table_name='policy_notes')
    op.drop_index(op.f('ix_policy_notes_agency_id'), table_name='policy_notes')
    op.drop_table('policy_notes')
