"""poll participant_count

Revision ID: 0002_participant_count
Revises: 0001_init
Create Date: 2026-04-15
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0002_participant_count"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "polls",
        sa.Column("participant_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.alter_column("polls", "participant_count", server_default=None)

    # Для опросов и одиночного выбора сумма голосов по первому вопросу = число участников.
    # Для simple + multiple_choice исторически это не так — оставляем 0, дальше считаем при голосовании.
    op.execute(
        """
        UPDATE polls p
        SET participant_count = COALESCE(
            (
                SELECT SUM(po.vote_count)::integer
                FROM poll_questions pq
                JOIN poll_options po ON po.question_id = pq.id
                WHERE pq.poll_id = p.id
                  AND pq.position = (
 SELECT MIN(pq2.position) FROM poll_questions pq2 WHERE pq2.poll_id = p.id
                  )
            ),
            0
        )
        WHERE NOT (p.kind = 'simple' AND p.is_multiple_choice = true);
        """
    )


def downgrade() -> None:
    op.drop_column("polls", "participant_count")
