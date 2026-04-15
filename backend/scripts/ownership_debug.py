import asyncio
import os
import sys

BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from sqlalchemy import text

from app.db.session import SessionLocal


async def main() -> None:
    async with SessionLocal() as db:
        users = await db.execute(text("select id, email from users order by created_at"))
        print("USERS:")
        for row in users.fetchall():
            print(dict(row._mapping))

        polls = await db.execute(
            text("select id, title, kind, owner_id, created_at from polls order by created_at")
        )
        print("\nPOLLS:")
        for row in polls.fetchall():
            print(dict(row._mapping))


if __name__ == "__main__":
    asyncio.run(main())
