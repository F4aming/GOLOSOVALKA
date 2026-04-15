from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_optional_user_id
from app.db.session import get_db
from app.schemas.polls import PollOut, SimpleVoteRequest, SurveySubmitRequest
from app.services.poll_service import PollService


router = APIRouter(prefix="/public/polls", tags=["public-polls"])


def _parse_poll_id(poll_id: str) -> UUID:
    try:
        return UUID(poll_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid poll id")


def _parse_guest_header(x_guest_id: str | None) -> UUID | None:
    """Некорректный X-Guest-Id не должен ломать загрузку опроса (раньше давал 422 → «не найдено» на фронте)."""
    if x_guest_id is None or not str(x_guest_id).strip():
        return None
    try:
        return UUID(str(x_guest_id).strip())
    except ValueError:
        return None


@router.get("/{poll_id}", response_model=PollOut)
async def get_poll_public(
    poll_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: UUID | None = Depends(get_optional_user_id),
    x_guest_id: str | None = Header(None, alias="X-Guest-Id"),
) -> PollOut:
    guest_id = _parse_guest_header(x_guest_id)
    svc = PollService(db)
    try:
        poll = await svc.get_poll_public(_parse_poll_id(poll_id))
    except LookupError:
        raise HTTPException(status_code=404, detail="Poll not found")
    return await svc.to_poll_out_participant(poll, user_id=user_id, guest_id=guest_id)


@router.post("/{poll_id}/vote", response_model=PollOut)
async def vote_simple_public(
    poll_id: str,
    payload: SimpleVoteRequest,
    db: AsyncSession = Depends(get_db),
    user_id: UUID | None = Depends(get_optional_user_id),
    x_guest_id: str | None = Header(None, alias="X-Guest-Id"),
) -> PollOut:
    guest_id = _parse_guest_header(x_guest_id)
    if user_id is None and guest_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in or send X-Guest-Id to vote",
        )
    svc = PollService(db)
    try:
        poll = await svc.vote_simple_participant(
            poll_id=_parse_poll_id(poll_id),
            option_indexes=payload.option_indexes,
            user_id=user_id,
            guest_id=guest_id,
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
    return await svc.to_poll_out_participant(poll, user_id=user_id, guest_id=guest_id)


@router.post("/{poll_id}/revoke-vote", response_model=PollOut)
async def revoke_simple_vote_public(
    poll_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: UUID | None = Depends(get_optional_user_id),
    x_guest_id: str | None = Header(None, alias="X-Guest-Id"),
) -> PollOut:
    guest_id = _parse_guest_header(x_guest_id)
    if user_id is None and guest_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in or send X-Guest-Id",
        )
    svc = PollService(db)
    try:
        poll = await svc.revoke_simple_vote_participant(
            poll_id=_parse_poll_id(poll_id), user_id=user_id, guest_id=guest_id
        )
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
    return await svc.to_poll_out_participant(poll, user_id=user_id, guest_id=guest_id)


@router.post("/{poll_id}/submit", response_model=PollOut)
async def submit_survey_public(
    poll_id: str,
    payload: SurveySubmitRequest,
    db: AsyncSession = Depends(get_db),
    user_id: UUID | None = Depends(get_optional_user_id),
    x_guest_id: str | None = Header(None, alias="X-Guest-Id"),
) -> PollOut:
    guest_id = _parse_guest_header(x_guest_id)
    if user_id is None and guest_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in or send X-Guest-Id to submit",
        )
    svc = PollService(db)
    try:
        poll = await svc.submit_survey_participant(
            poll_id=_parse_poll_id(poll_id),
            answers=payload.answers,
            user_id=user_id,
            guest_id=guest_id,
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
    return await svc.to_poll_out_participant(poll, user_id=user_id, guest_id=guest_id)
