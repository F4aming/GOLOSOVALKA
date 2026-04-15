"""guest ballots and ballot primary key

Revision ID: 0005_guest_ballots
Revises: 0004_vote_cancellation
Create Date: 2026-04-15
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0005_guest_ballots"
down_revision = "0004_vote_cancellation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("poll_ballots", sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True))
    op.execute("UPDATE poll_ballots SET id = uuid_generate_v4() WHERE id IS NULL")
    op.alter_column("poll_ballots", "id", nullable=False)
    op.add_column("poll_ballots", sa.Column("guest_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True))
    op.drop_constraint("pk_poll_ballots", "poll_ballots", type_="primary")
    op.alter_column("poll_ballots", "user_id", existing_type=sa.dialects.postgresql.UUID(as_uuid=True), nullable=True)
    op.create_primary_key("pk_poll_ballots", "poll_ballots", ["id"])
    op.create_index(
        "uq_poll_ballots_poll_user",
        "poll_ballots",
        ["poll_id", "user_id"],
        unique=True,
        postgresql_where=sa.text("user_id IS NOT NULL"),
    )
    op.create_index(
        "uq_poll_ballots_poll_guest",
        "poll_ballots",
        ["poll_id", "guest_id"],
        unique=True,
        postgresql_where=sa.text("guest_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_poll_ballots_poll_guest", table_name="poll_ballots")
    op.drop_index("uq_poll_ballots_poll_user", table_name="poll_ballots")
    op.drop_constraint("pk_poll_ballots", "poll_ballots", type_="primary")
    op.execute("DELETE FROM poll_ballots WHERE user_id IS NULL")
    op.drop_column("poll_ballots", "guest_id")
    op.drop_column("poll_ballots", "id")
    op.alter_column("poll_ballots", "user_id", existing_type=sa.dialects.postgresql.UUID(as_uuid=True), nullable=False)
    op.create_primary_key("pk_poll_ballots", "poll_ballots", ["poll_id", "user_id"])
