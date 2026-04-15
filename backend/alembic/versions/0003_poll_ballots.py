"""poll_ballots one vote per user

Revision ID: 0003_poll_ballots
Revises: 0002_participant_count
Create Date: 2026-04-15
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0003_poll_ballots"
down_revision = "0002_participant_count"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "poll_ballots",
        sa.Column("poll_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["poll_id"], ["polls.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("poll_id", "user_id", name="pk_poll_ballots"),
    )


def downgrade() -> None:
    op.drop_table("poll_ballots")
