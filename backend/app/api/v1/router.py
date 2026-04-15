from fastapi import APIRouter

from app.api.v1 import auth, polls, public_polls


api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(polls.router)
api_router.include_router(public_polls.router)

