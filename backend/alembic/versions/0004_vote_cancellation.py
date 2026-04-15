"""allow vote cancellation + store simple vote indexes on ballot

Revision ID: 0004_vote_cancellation
Revises: 0003_poll_ballots
Create Date: 2026-04-15
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0004_vote_cancellation"
down_revision = "0003_poll_ballots"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "polls",
        sa.Column("allow_vote_cancellation", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.alter_column("polls", "allow_vote_cancellation", server_default=None)
    op.add_column("poll_ballots", sa.Column("simple_vote_indexes", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("poll_ballots", "simple_vote_indexes")
    op.drop_column("polls", "allow_vote_cancellation")
