from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.security import hash_password, verify_password


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _normalize_email(email: str) -> str:
        return email.strip().lower()

    async def register(self, *, email: str, password: str) -> User:
        email = self._normalize_email(email)
        existing = await self.db.scalar(select(User).where(User.email == email))
        if existing is not None:
            raise ValueError("EMAIL_TAKEN")

        user = User(email=email, password_hash=hash_password(password))
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def authenticate(self, *, email: str, password: str) -> User:
        email = self._normalize_email(email)
        user = await self.db.scalar(select(User).where(User.email == email))
        if user is None:
            raise ValueError("INVALID_CREDENTIALS")
        if not verify_password(password, user.password_hash):
            raise ValueError("INVALID_CREDENTIALS")
        return user

