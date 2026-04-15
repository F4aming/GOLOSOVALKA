from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.db.session import get_db
from app.models.poll import PollKind
from app.schemas.polls import (
    PollOut,
    SimplePollCreate,
    SimpleVoteRequest,
    SurveyCreate,
    SurveySubmitRequest,
)
from app.services.poll_service import PollService


router = APIRouter(prefix="/polls", tags=["polls"])


def _parse_poll_id(poll_id: str) -> UUID:
    try:
        return UUID(poll_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid poll id")


@router.post("/simple", response_model=PollOut, status_code=status.HTTP_201_CREATED)
async def create_simple(
    payload: SimplePollCreate,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> PollOut:
    svc = PollService(db)
    poll = await svc.create_simple_poll(
        owner_id=user_id,
        question=payload.question,
        options=payload.options,
        multiple_choice=payload.multiple_choice,
        allow_vote_cancellation=payload.allow_vote_cancellation,
    )
    return await svc.to_poll_out_owner(poll, voter_id=user_id)


@router.post("/survey", response_model=PollOut, status_code=status.HTTP_201_CREATED)
async def create_survey(
    payload: SurveyCreate,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> PollOut:
    svc = PollService(db)
    poll = await svc.create_survey(
        owner_id=user_id, title=payload.title, questions=[q.model_dump() for q in payload.questions]
    )
    return await svc.to_poll_out_owner(poll, voter_id=user_id)


@router.get("", response_model=list[PollOut])
async def list_polls(
    kind: str | None = Query(default=None, pattern="^(simple|survey)$"),
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> list[PollOut]:
    svc = PollService(db)
    parsed_kind = None if kind is None else PollKind(kind)
    polls = await svc.list_polls(owner_id=user_id, kind=parsed_kind)
    voted = await svc.voted_poll_ids_for_user(user_id, [p.id for p in polls])
    return [
        PollOut.model_validate(p).model_copy(update={"has_voted": p.id in voted, "can_manage": True})
        for p in polls
    ]


@router.get("/{poll_id}", response_model=PollOut)
async def get_poll(
    poll_id: str, db: AsyncSession = Depends(get_db), user_id: UUID = Depends(get_current_user_id)
) -> PollOut:
    svc = PollService(db)
    try:
        poll = await svc.get_poll(_parse_poll_id(poll_id), owner_id=user_id)
    except LookupError:
        raise HTTPException(status_code=404, detail="Poll not found")
    return await svc.to_poll_out_owner(poll, voter_id=user_id)


@router.delete("/{poll_id}")
async def delete_poll(
    poll_id: str, db: AsyncSession = Depends(get_db), user_id: UUID = Depends(get_current_user_id)
) -> dict[str, bool]:
    svc = PollService(db)
    try:
        await svc.delete_poll(owner_id=user_id, poll_id=_parse_poll_id(poll_id))
    except LookupError:
        raise HTTPException(status_code=404, detail="Poll not found")
    return {"ok": True}


@router.post("/{poll_id}/vote", response_model=PollOut)
async def vote_simple(
    poll_id: str,
    payload: SimpleVoteRequest,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> PollOut:
    svc = PollService(db)
    try:
        poll = await svc.vote_simple(
            owner_id=user_id, poll_id=_parse_poll_id(poll_id), option_indexes=payload.option_indexes
        )
    except LookupError:
        raise HTTPException(status_code=404, detail="Poll not found")
    except ValueError as e:
        code = str(e)
        if code in {"POLL_FINISHED"}:
            raise HTTPException(status_code=409, detail="Poll finished")
        if code in {"ALREADY_VOTED"}:
            raise HTTPException(status_code=409, detail="Already voted")
        raise HTTPException(status_code=400, detail=code)
    return await svc.to_poll_out_owner(poll, voter_id=user_id)


@router.post("/{poll_id}/revoke-vote", response_model=PollOut)
async def revoke_simple_vote(
    poll_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> PollOut:
    svc = PollService(db)
    try:
        poll = await svc.revoke_simple_vote(owner_id=user_id, poll_id=_parse_poll_id(poll_id))
    except LookupError:
        raise HTTPException(status_code=404, detail="Poll not found")
    except ValueError as e:
        code = str(e)
        if code in {"POLL_FINISHED"}:
            raise HTTPException(status_code=409, detail="Poll finished")
        if code in {"REVOCATION_NOT_ALLOWED"}:
            raise HTTPException(status_code=403, detail="Vote cancellation is disabled for this poll")
        if code in {"NOT_VOTED"}:
            raise HTTPException(status_code=400, detail="Not voted")
        if code in {"CANNOT_REVOKE_LEGACY_VOTE"}:
            raise HTTPException(status_code=409, detail="Cannot revoke this vote")
        if code in {"WRONG_KIND"}:
            raise HTTPException(status_code=400, detail=code)
        raise HTTPException(status_code=400, detail=code)
    return await svc.to_poll_out_owner(poll, voter_id=user_id)


@router.post("/{poll_id}/submit", response_model=PollOut)
async def submit_survey(
    poll_id: str,
    payload: SurveySubmitRequest,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> PollOut:
    svc = PollService(db)
    try:
        poll = await svc.submit_survey(
            owner_id=user_id, poll_id=_parse_poll_id(poll_id), answers=payload.answers
        )
    except LookupError:
        raise HTTPException(status_code=404, detail="Poll not found")
    except ValueError as e:
        code = str(e)
        if code in {"POLL_FINISHED"}:
            raise HTTPException(status_code=409, detail="Poll finished")
        if code in {"ALREADY_VOTED"}:
            raise HTTPException(status_code=409, detail="Already voted")
        raise HTTPException(status_code=400, detail=code)
    return await svc.to_poll_out_owner(poll, voter_id=user_id)


@router.post("/{poll_id}/finish", response_model=PollOut)
async def finish(
    poll_id: str, db: AsyncSession = Depends(get_db), user_id: UUID = Depends(get_current_user_id)
) -> PollOut:
    svc = PollService(db)
    try:
        poll = await svc.finish_poll(owner_id=user_id, poll_id=_parse_poll_id(poll_id))
    except LookupError:
        raise HTTPException(status_code=404, detail="Poll not found")
    return await svc.to_poll_out_owner(poll, voter_id=user_id)

