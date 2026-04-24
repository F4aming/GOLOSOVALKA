from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.poll import PollKind


class SimplePollCreate(BaseModel):
    question: str = Field(min_length=1, max_length=400)
    options: list[str] = Field(min_length=2, max_length=10)
    multiple_choice: bool = False
    allow_vote_cancellation: bool = False


class SurveyQuestionCreate(BaseModel):
    question_text: str = Field(min_length=1, max_length=600)
    options: list[str] = Field(min_length=2, max_length=20)
    multiple_choice: bool = False


class SurveyCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    questions: list[SurveyQuestionCreate] = Field(min_length=1, max_length=50)


class PollOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    position: int
    text: str
    vote_count: int


class PollQuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    position: int
    text: str
    is_multiple_choice: bool
    options: list[PollOptionOut]


class PollOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    kind: PollKind
    title: str
    is_multiple_choice: bool
    allow_vote_cancellation: bool
    is_finished: bool
    participant_count: int
    has_voted: bool = False
    can_manage: bool = False
    created_at: datetime
    questions: list[PollQuestionOut]


class SimpleVoteRequest(BaseModel):
    option_indexes: list[int] = Field(min_length=1, max_length=10)


class SurveySubmitRequest(BaseModel):
    answers: dict[int, int | list[int]] = Field(
        description="key=questionIndex (0..n-1), value=optionIndex or list[optionIndex]"
    )

