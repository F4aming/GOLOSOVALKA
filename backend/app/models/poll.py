from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PollKind(str, enum.Enum):
    simple = "simple"  # один вопрос, варианты, счётчики
    survey = "survey"  # несколько вопросов, ответы на каждый вопрос


class Poll(Base):
    __tablename__ = "polls"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kind: Mapped[PollKind] = mapped_column(Enum(PollKind, name="poll_kind"), nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_multiple_choice: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_vote_cancellation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_finished: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    participant_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    owner_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    questions: Mapped[list["PollQuestion"]] = relationship(back_populates="poll", cascade="all, delete-orphan")


class PollQuestion(Base):
    __tablename__ = "poll_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poll_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("polls.id", ondelete="CASCADE"), nullable=False)

    position: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    poll: Mapped[Poll] = relationship(back_populates="questions")
    options: Mapped[list["PollOption"]] = relationship(back_populates="question", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("poll_id", "position", name="uq_poll_question_position"),)


class PollBallot(Base):
    """Не более одного голоса на зарегистрированного пользователя или гостя (X-Guest-Id) на опрос."""

    __tablename__ = "poll_ballots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poll_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("polls.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    guest_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    simple_vote_indexes: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        Index(
            "uq_poll_ballots_poll_user",
            "poll_id",
            "user_id",
            unique=True,
            postgresql_where=text("user_id IS NOT NULL"),
        ),
        Index(
            "uq_poll_ballots_poll_guest",
            "poll_id",
            "guest_id",
            unique=True,
            postgresql_where=text("guest_id IS NOT NULL"),
        ),
    )


class PollOption(Base):
    __tablename__ = "poll_options"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("poll_questions.id", ondelete="CASCADE"), nullable=False
    )

    position: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    vote_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    question: Mapped[PollQuestion] = relationship(back_populates="options")

    __table_args__ = (UniqueConstraint("question_id", "position", name="uq_question_option_position"),)

