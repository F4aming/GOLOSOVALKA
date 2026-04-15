import asyncio
import os
import sys

BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.db.session import SessionLocal
from app.services.auth_service import AuthService


async def main() -> None:
    email = "debug_user@example.com"
    password = "12345678"
    async with SessionLocal() as db:
        svc = AuthService(db)
        try:
            user = await svc.register(email=email, password=password)
            print("registered", user.email)
        except Exception as e:
            print("register err", repr(e))

        try:
            user = await svc.authenticate(email=email, password=password)
            print("auth ok", user.email)
        except Exception as e:
            print("auth err", repr(e))


if __name__ == "__main__":
    asyncio.run(main())
