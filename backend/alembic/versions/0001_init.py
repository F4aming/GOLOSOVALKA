"""init

Revision ID: 0001_init
Revises: 
Create Date: 2026-04-13
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

    op.create_table(
        "users",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "polls",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("kind", sa.Enum("simple", "survey", name="poll_kind"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_multiple_choice", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_finished", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("owner_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "poll_questions",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "poll_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("polls.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
    )
    op.create_unique_constraint("uq_poll_question_position", "poll_questions", ["poll_id", "position"])

    op.create_table(
        "poll_options",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "question_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("poll_questions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("vote_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )
    op.create_unique_constraint("uq_question_option_position", "poll_options", ["question_id", "position"])


def downgrade() -> None:
    op.drop_table("poll_options")
    op.drop_table("poll_questions")
    op.drop_table("polls")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS poll_kind;")

