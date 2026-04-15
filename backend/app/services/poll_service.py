from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.poll import Poll, PollBallot, PollKind, PollOption, PollQuestion
from app.schemas.polls import PollOut


class PollService:
    async def list_polls(self, *, owner_id: UUID, kind: PollKind | None = None) -> list[Poll]:
        stmt = select(Poll).options(selectinload(Poll.questions).selectinload(PollQuestion.options))
        stmt = stmt.where(Poll.owner_id == owner_id)
        if kind is not None:
            stmt = stmt.where(Poll.kind == kind)
        stmt = stmt.order_by(Poll.created_at.desc())
        polls = (await self.db.scalars(stmt)).all()
        for poll in polls:
            poll.questions.sort(key=lambda x: x.position)
            for q in poll.questions:
                q.options.sort(key=lambda x: x.position)
        return list(polls)

    def __init__(self, db: AsyncSession):
        self.db = db

    async def user_has_voted(self, poll_id: UUID, user_id: UUID) -> bool:
        stmt = select(PollBallot.poll_id).where(PollBallot.poll_id == poll_id, PollBallot.user_id == user_id)
        return (await self.db.scalar(stmt)) is not None

    async def voted_poll_ids_for_user(self, user_id: UUID, poll_ids: list[UUID]) -> set[UUID]:
        if not poll_ids:
            return set()
        stmt = select(PollBallot.poll_id).where(PollBallot.user_id == user_id, PollBallot.poll_id.in_(poll_ids))
        return set((await self.db.scalars(stmt)).all())

    async def to_poll_out(self, poll: Poll, *, voter_id: UUID) -> PollOut:
        voted = await self.user_has_voted(poll.id, voter_id)
        return PollOut.model_validate(poll).model_copy(update={"has_voted": voted})

    async def create_simple_poll(
        self,
        *,
        owner_id: UUID,
        question: str,
        options: list[str],
        multiple_choice: bool,
        allow_vote_cancellation: bool = False,
    ) -> Poll:
        poll = Poll(
            kind=PollKind.simple,
            title=question.strip(),
            is_multiple_choice=multiple_choice,
            allow_vote_cancellation=allow_vote_cancellation,
            owner_id=owner_id,
        )
        q = PollQuestion(position=0, text=question.strip())
        q.options = [PollOption(position=i, text=opt.strip()) for i, opt in enumerate(options)]
        poll.questions = [q]
        self.db.add(poll)
        await self.db.commit()
        return await self.get_poll(poll.id, owner_id=owner_id)

    async def create_survey(self, *, owner_id: UUID, title: str, questions: list[dict]) -> Poll:
        poll = Poll(
            kind=PollKind.survey,
            title=title.strip(),
            is_multiple_choice=False,
            allow_vote_cancellation=False,
            owner_id=owner_id,
        )
        poll.questions = []
        for qi, q in enumerate(questions):
            qq = PollQuestion(position=qi, text=q["question_text"].strip())
            qq.options = [PollOption(position=oi, text=opt.strip()) for oi, opt in enumerate(q["options"])]
            poll.questions.append(qq)
        self.db.add(poll)
        await self.db.commit()
        return await self.get_poll(poll.id, owner_id=owner_id)

    async def get_poll(self, poll_id, *, owner_id: UUID) -> Poll:
        stmt = (
            select(Poll)
            .where(Poll.id == poll_id, Poll.owner_id == owner_id)
            .options(selectinload(Poll.questions).selectinload(PollQuestion.options))
        )
        poll = await self.db.scalar(stmt)
        if poll is None:
            raise LookupError("NOT_FOUND")
        poll.questions.sort(key=lambda x: x.position)
        for q in poll.questions:
            q.options.sort(key=lambda x: x.position)
        return poll

    async def vote_simple(self, *, owner_id: UUID, poll_id, option_indexes: list[int]) -> Poll:
        poll = await self.get_poll(poll_id, owner_id=owner_id)
        if poll.kind != PollKind.simple:
            raise ValueError("WRONG_KIND")
        if poll.is_finished:
            raise ValueError("POLL_FINISHED")

        q = poll.questions[0]
        max_idx = len(q.options) - 1
        if any(i < 0 or i > max_idx for i in option_indexes):
            raise ValueError("BAD_OPTION_INDEX")
        if not poll.is_multiple_choice and len(set(option_indexes)) != 1:
            raise ValueError("SINGLE_CHOICE_ONLY")

        if await self.user_has_voted(poll.id, owner_id):
            raise ValueError("ALREADY_VOTED")

        for i in set(option_indexes):
            q.options[i].vote_count += 1
        poll.participant_count += 1
        stored = sorted(set(option_indexes))
        self.db.add(
            PollBallot(poll_id=poll.id, user_id=owner_id, simple_vote_indexes=stored)
        )
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise ValueError("ALREADY_VOTED") from None
        return await self.get_poll(poll_id, owner_id=owner_id)

    async def revoke_simple_vote(self, *, owner_id: UUID, poll_id) -> Poll:
        poll = await self.get_poll(poll_id, owner_id=owner_id)
        if poll.kind != PollKind.simple:
            raise ValueError("WRONG_KIND")
        if not poll.allow_vote_cancellation:
            raise ValueError("REVOCATION_NOT_ALLOWED")
        if poll.is_finished:
            raise ValueError("POLL_FINISHED")

        stmt = select(PollBallot).where(PollBallot.poll_id == poll.id, PollBallot.user_id == owner_id)
        ballot = await self.db.scalar(stmt)
        if ballot is None:
            raise ValueError("NOT_VOTED")
        indexes = ballot.simple_vote_indexes
        if not indexes:
            raise ValueError("CANNOT_REVOKE_LEGACY_VOTE")

        q = poll.questions[0]
        for i in indexes:
            if i < 0 or i >= len(q.options):
                raise ValueError("CORRUPT_BALLOT")
            q.options[i].vote_count = max(0, q.options[i].vote_count - 1)
        poll.participant_count = max(0, poll.participant_count - 1)
        await self.db.delete(ballot)
        await self.db.commit()
        return await self.get_poll(poll_id, owner_id=owner_id)

    async def submit_survey(self, *, owner_id: UUID, poll_id, answers: dict[int, int]) -> Poll:
        poll = await self.get_poll(poll_id, owner_id=owner_id)
        if poll.kind != PollKind.survey:
            raise ValueError("WRONG_KIND")
        if poll.is_finished:
            raise ValueError("POLL_FINISHED")

        if await self.user_has_voted(poll.id, owner_id):
            raise ValueError("ALREADY_VOTED")

        if len(answers) != len(poll.questions):
            raise ValueError("INCOMPLETE")

        for q in poll.questions:
            qi = q.position
            if qi not in answers:
                raise ValueError("INCOMPLETE")
            oi = answers[qi]
            if oi < 0 or oi >= len(q.options):
                raise ValueError("BAD_OPTION_INDEX")
            q.options[oi].vote_count += 1

        poll.participant_count += 1
        self.db.add(PollBallot(poll_id=poll.id, user_id=owner_id))
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise ValueError("ALREADY_VOTED") from None
        return await self.get_poll(poll_id, owner_id=owner_id)

    async def finish_poll(self, *, owner_id: UUID, poll_id) -> Poll:
        poll = await self.get_poll(poll_id, owner_id=owner_id)
        poll.is_finished = True
        await self.db.commit()
        return await self.get_poll(poll_id, owner_id=owner_id)

    async def delete_poll(self, *, owner_id: UUID, poll_id) -> None:
        poll = await self.get_poll(poll_id, owner_id=owner_id)
        await self.db.delete(poll)
        await self.db.commit()

