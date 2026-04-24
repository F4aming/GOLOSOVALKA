"""question-level multiple choice for surveys

Revision ID: 0006_question_multiple_choice
Revises: 0005_guest_ballots
Create Date: 2026-04-24
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0006_question_multiple_choice"
down_revision = "0005_guest_ballots"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "poll_questions",
        sa.Column("is_multiple_choice", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.alter_column("poll_questions", "is_multiple_choice", server_default=None)


def downgrade() -> None:
    op.drop_column("poll_questions", "is_multiple_choice")
