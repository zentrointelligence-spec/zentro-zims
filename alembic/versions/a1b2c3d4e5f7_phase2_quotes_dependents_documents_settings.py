"""Phase 2: customer id_number, quote fields, dependents, documents redesign, agency_settings.

Revision ID: a1b2c3d4e5f7
Revises: 0fa18aa1af07
Create Date: 2026-04-20

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f7"
down_revision: Union[str, None] = "0fa18aa1af07"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    def _cols(table: str) -> set[str]:
        return {c["name"] for c in sa.inspect(bind).get_columns(table)}

    def _has_table(table: str) -> bool:
        return sa.inspect(bind).has_table(table)

    def _idx(table: str) -> set[str]:
        return {i["name"] for i in sa.inspect(bind).get_indexes(table)}

    cust = _cols("customers")
    if "date_of_birth" not in cust:
        op.add_column("customers", sa.Column("date_of_birth", sa.Date(), nullable=True))
        cix = {i["name"] for i in sa.inspect(bind).get_indexes("customers")}
        if "ix_customers_date_of_birth" not in cix:
            op.create_index(
                op.f("ix_customers_date_of_birth"), "customers", ["date_of_birth"], unique=False
            )
    if "id_number" not in cust:
        op.add_column("customers", sa.Column("id_number", sa.String(length=50), nullable=True))

    qcols = _cols("quotes")
    if "insurer" not in qcols:
        op.add_column(
            "quotes",
            sa.Column("insurer", sa.String(length=255), nullable=False, server_default=""),
        )
    if "notes" not in qcols:
        op.add_column("quotes", sa.Column("notes", sa.Text(), nullable=True))
    if dialect != "sqlite":
        try:
            op.alter_column("quotes", "insurer", server_default=None)
        except Exception:
            pass

    if not _has_table("agency_settings"):
        op.create_table(
            "agency_settings",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("agency_id", sa.Integer(), nullable=False),
            sa.Column("logo_url", sa.String(length=512), nullable=True),
            sa.Column("whatsapp_number", sa.String(length=64), nullable=True),
            sa.Column("email_sender_name", sa.String(length=255), nullable=True),
            sa.Column("timezone", sa.String(length=64), nullable=False, server_default="UTC"),
            sa.Column("renewal_window_days", sa.Integer(), nullable=False, server_default="30"),
            sa.Column("renewal_message_template", sa.Text(), nullable=True),
            sa.Column("birthday_message_template", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("(CURRENT_TIMESTAMP)"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("(CURRENT_TIMESTAMP)"),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["agency_id"], ["agencies.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("agency_id"),
        )
    as_ix = _idx("agency_settings")
    if "ix_agency_settings_agency_id" not in as_ix:
        op.create_index(
            op.f("ix_agency_settings_agency_id"), "agency_settings", ["agency_id"], unique=True
        )
    if "ix_agency_settings_id" not in as_ix:
        op.create_index(op.f("ix_agency_settings_id"), "agency_settings", ["id"], unique=False)

    dcols = _cols("dependents")
    dependents_done = "relationship" in dcols and "relationship_label" not in dcols
    if not dependents_done:
        if "relationship" not in dcols:
            op.add_column(
                "dependents",
                sa.Column("relationship", sa.String(length=20), nullable=True),
            )
        if "id_number" not in dcols:
            op.add_column(
                "dependents",
                sa.Column("id_number", sa.String(length=50), nullable=True),
            )

        if "relationship_label" in _cols("dependents"):
            op.execute(
                """
                UPDATE dependents
                SET relationship = CASE
                    WHEN lower(relationship_label) IN ('spouse','child','parent','other')
                        THEN lower(relationship_label)
                    ELSE 'other'
                END
                WHERE relationship IS NULL
                """
            )

    if not dependents_done and "relationship_label" in _cols("dependents"):
        if dialect == "sqlite":
            op.execute(
                """
                CREATE TABLE dependents_new (
                    id INTEGER NOT NULL,
                    customer_id INTEGER NOT NULL,
                    agency_id INTEGER NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    date_of_birth DATE,
                    relationship VARCHAR(20) NOT NULL,
                    id_number VARCHAR(50),
                    created_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                    PRIMARY KEY (id),
                    FOREIGN KEY(customer_id) REFERENCES customers (id) ON DELETE CASCADE,
                    FOREIGN KEY(agency_id) REFERENCES agencies (id) ON DELETE CASCADE
                )
                """
            )
            op.execute(
                """
                INSERT INTO dependents_new (
                    id, customer_id, agency_id, name, date_of_birth, relationship, id_number, created_at
                )
                SELECT
                    id, customer_id, agency_id, name, date_of_birth,
                    COALESCE(relationship, 'other'), id_number, created_at
                FROM dependents
                """
            )
            op.drop_table("dependents")
            op.execute("ALTER TABLE dependents_new RENAME TO dependents")
            op.create_index(
                op.f("ix_dependents_agency_id"), "dependents", ["agency_id"], unique=False
            )
            op.create_index(
                op.f("ix_dependents_customer_id"), "dependents", ["customer_id"], unique=False
            )
            op.create_index(op.f("ix_dependents_id"), "dependents", ["id"], unique=False)
        else:
            op.alter_column("dependents", "relationship", nullable=False, server_default="other")
            try:
                op.alter_column("dependents", "relationship", server_default=None)
            except Exception:
                pass
            op.drop_column("dependents", "relationship_label")

    if "related_type" not in _cols("documents"):
        if dialect == "sqlite":
            op.execute("PRAGMA foreign_keys=OFF")
            op.execute(
                """
                CREATE TABLE documents_new (
                    id INTEGER NOT NULL,
                    agency_id INTEGER NOT NULL,
                    related_type VARCHAR(32) NOT NULL,
                    related_id INTEGER NOT NULL,
                    filename VARCHAR(512) NOT NULL,
                    file_path VARCHAR(512) NOT NULL,
                    file_size_kb INTEGER NOT NULL,
                    content_type VARCHAR(255) NOT NULL,
                    uploaded_by_user_id INTEGER,
                    created_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                    PRIMARY KEY (id),
                    FOREIGN KEY(agency_id) REFERENCES agencies (id) ON DELETE CASCADE,
                    FOREIGN KEY(uploaded_by_user_id) REFERENCES users (id) ON DELETE SET NULL
                )
                """
            )
            op.execute(
                """
                INSERT INTO documents_new (
                    id, agency_id, related_type, related_id, filename, file_path,
                    file_size_kb, content_type, uploaded_by_user_id, created_at
                )
                SELECT
                    id,
                    agency_id,
                    'customer',
                    customer_id,
                    COALESCE(NULLIF(TRIM(label), ''), 'document'),
                    file_path,
                    0,
                    COALESCE(NULLIF(TRIM(file_type), ''), 'application/octet-stream'),
                    NULL,
                    created_at
                FROM documents
                """
            )
            op.drop_table("documents")
            op.execute("ALTER TABLE documents_new RENAME TO documents")
            op.create_index(op.f("ix_documents_agency_id"), "documents", ["agency_id"], unique=False)
            op.create_index(op.f("ix_documents_id"), "documents", ["id"], unique=False)
            op.create_index(
                op.f("ix_documents_related_type"), "documents", ["related_type"], unique=False
            )
            op.create_index(
                op.f("ix_documents_related_id"), "documents", ["related_id"], unique=False
            )
            op.create_index(
                op.f("ix_documents_uploaded_by_user_id"),
                "documents",
                ["uploaded_by_user_id"],
                unique=False,
            )
            op.execute("PRAGMA foreign_keys=ON")
        else:
            op.add_column(
                "documents",
                sa.Column("related_type", sa.String(length=32), nullable=True),
            )
            op.add_column("documents", sa.Column("related_id", sa.Integer(), nullable=True))
            op.add_column("documents", sa.Column("filename", sa.String(length=512), nullable=True))
            op.add_column("documents", sa.Column("file_size_kb", sa.Integer(), nullable=True))
            op.add_column(
                "documents",
                sa.Column("content_type", sa.String(length=255), nullable=True),
            )
            op.add_column(
                "documents",
                sa.Column("uploaded_by_user_id", sa.Integer(), nullable=True),
            )
            op.create_foreign_key(
                "fk_documents_uploaded_by_user_id_users",
                "documents",
                "users",
                ["uploaded_by_user_id"],
                ["id"],
                ondelete="SET NULL",
            )
            op.execute(
                """
                UPDATE documents
                SET
                    related_type = 'customer',
                    related_id = customer_id,
                    filename = COALESCE(NULLIF(TRIM(label), ''), 'document'),
                    file_size_kb = 0,
                    content_type = COALESCE(NULLIF(TRIM(file_type), ''), 'application/octet-stream')
                """
            )
            op.alter_column("documents", "related_type", nullable=False)
            op.alter_column("documents", "related_id", nullable=False)
            op.alter_column("documents", "filename", nullable=False)
            op.alter_column("documents", "file_size_kb", nullable=False, server_default="0")
            op.alter_column("documents", "content_type", nullable=False)
            insp = sa.inspect(bind)
            for fk in insp.get_foreign_keys("documents"):
                if fk.get("constrained_columns") == ["customer_id"]:
                    op.drop_constraint(fk["name"], "documents", type_="foreignkey")
                    break
            op.drop_column("documents", "customer_id")
            op.drop_column("documents", "label")
            op.drop_column("documents", "file_type")
            op.create_index(
                op.f("ix_documents_related_type"), "documents", ["related_type"], unique=False
            )
            op.create_index(
                op.f("ix_documents_related_id"), "documents", ["related_id"], unique=False
            )
            op.create_index(
                op.f("ix_documents_uploaded_by_user_id"),
                "documents",
                ["uploaded_by_user_id"],
                unique=False,
            )


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "sqlite":
        op.execute("PRAGMA foreign_keys=OFF")
        op.execute(
            """
            CREATE TABLE documents_old (
                id INTEGER NOT NULL,
                agency_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                file_path VARCHAR(512) NOT NULL,
                file_type VARCHAR(128) NOT NULL,
                label VARCHAR(255) NOT NULL,
                created_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                PRIMARY KEY (id),
                FOREIGN KEY(agency_id) REFERENCES agencies (id) ON DELETE CASCADE,
                FOREIGN KEY(customer_id) REFERENCES customers (id) ON DELETE CASCADE
            )
            """
        )
        op.execute(
            """
            INSERT INTO documents_old (
                id, agency_id, customer_id, file_path, file_type, label, created_at
            )
            SELECT
                id,
                agency_id,
                related_id,
                file_path,
                content_type,
                filename,
                created_at
            FROM documents
            WHERE related_type = 'customer'
            """
        )
        op.drop_table("documents")
        op.execute("ALTER TABLE documents_old RENAME TO documents")
        op.create_index(op.f("ix_documents_agency_id"), "documents", ["agency_id"], unique=False)
        op.create_index(op.f("ix_documents_customer_id"), "documents", ["customer_id"], unique=False)
        op.create_index(op.f("ix_documents_id"), "documents", ["id"], unique=False)
        op.execute("PRAGMA foreign_keys=ON")
    else:
        op.add_column(
            "documents",
            sa.Column("customer_id", sa.Integer(), nullable=True),
        )
        op.add_column(
            "documents",
            sa.Column("label", sa.String(length=255), nullable=True),
        )
        op.add_column(
            "documents",
            sa.Column("file_type", sa.String(length=128), nullable=True),
        )
        op.drop_constraint("fk_documents_uploaded_by_user_id_users", "documents", type_="foreignkey")
        op.drop_index(op.f("ix_documents_uploaded_by_user_id"), table_name="documents")
        op.drop_index(op.f("ix_documents_related_id"), table_name="documents")
        op.drop_index(op.f("ix_documents_related_type"), table_name="documents")
        op.execute(
            """
            UPDATE documents
            SET customer_id = related_id,
                label = filename,
                file_type = content_type
            WHERE related_type = 'customer'
            """
        )
        op.drop_column("documents", "uploaded_by_user_id")
        op.drop_column("documents", "content_type")
        op.drop_column("documents", "file_size_kb")
        op.drop_column("documents", "filename")
        op.drop_column("documents", "related_id")
        op.drop_column("documents", "related_type")
        op.alter_column("documents", "customer_id", nullable=False)
        op.alter_column("documents", "label", nullable=False)
        op.alter_column("documents", "file_type", nullable=False)
        op.create_foreign_key(
            "documents_customer_id_fkey",
            "documents",
            "customers",
            ["customer_id"],
            ["id"],
            ondelete="CASCADE",
        )

    op.add_column(
        "dependents",
        sa.Column("relationship_label", sa.String(length=64), nullable=True),
    )
    op.execute(
        "UPDATE dependents SET relationship_label = relationship WHERE relationship_label IS NULL"
    )
    op.drop_column("dependents", "relationship")
    op.drop_column("dependents", "id_number")

    op.drop_index(op.f("ix_agency_settings_id"), table_name="agency_settings")
    op.drop_index(op.f("ix_agency_settings_agency_id"), table_name="agency_settings")
    op.drop_table("agency_settings")

    op.drop_column("quotes", "notes")
    op.drop_column("quotes", "insurer")
    op.drop_column("customers", "id_number")
