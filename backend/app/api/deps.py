from __future__ import annotations

from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.services.security import decode_token


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> UUID:
    try:
        payload = decode_token(token)
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token")
        return UUID(sub)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")
