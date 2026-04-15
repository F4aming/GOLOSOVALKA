from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import AuthService
from app.services.security import create_access_token


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    service = AuthService(db)
    try:
        user = await service.register(email=payload.email, password=payload.password)
    except ValueError as e:
        if str(e) == "EMAIL_TAKEN":
            raise HTTPException(status_code=409, detail="Email already registered")
        raise
    return TokenResponse(access_token=create_access_token(user_id=user.id))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    service = AuthService(db)
    try:
        user = await service.authenticate(email=payload.email, password=payload.password)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(user_id=user.id))

