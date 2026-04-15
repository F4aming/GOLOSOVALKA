import os
import sys
import asyncio

import asyncpg
from urllib.parse import urlparse, unquote

# Allow running as: `python scripts\db_check.py`
BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.core.config import settings


async def main() -> None:
    url = settings.database_url
    parsed = urlparse(url)
    if parsed.scheme not in {"postgresql", "postgresql+asyncpg"}:
        raise RuntimeError(f"Unsupported DATABASE_URL scheme: {parsed.scheme!r}")

    user = unquote(parsed.username or "postgres")
    password = unquote(parsed.password or "")
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 5432
    dbname = (parsed.path or "").lstrip("/") or "postgres"

    print("DATABASE_URL host/port/db:", host, port, dbname)

    last_err: Exception | None = None
    for ssl in (None, True, False):
        try:
            admin = await asyncpg.connect(
                user=user,
                password=password,
                database="postgres",
                host=host,
                port=port,
                ssl=ssl,
            )
            print("admin connected with ssl=", ssl)
            break
        except Exception as e:
            print("admin connect failed with ssl=", ssl, "err=", repr(e))
            last_err = e
    else:
        assert last_err is not None
        raise last_err

    try:
        v = await admin.fetchval("select version()")
        print("admin connected:", v)

        exists = await admin.fetchval("select 1 from pg_database where datname = $1", dbname)
        if not exists:
            await admin.execute(f'create database "{dbname}"')
            print("database created:", dbname)
    finally:
        await admin.close()

    try:
        conn = await asyncpg.connect(
            user=user,
            password=password,
            database=dbname,
            host=host,
            port=port,
        )
        try:
            ok = await conn.fetchval("select 1")
            print("app db connected:", ok)
        finally:
            await conn.close()
    except Exception as e:
        print("app db connect failed:", repr(e))
        raise


if __name__ == "__main__":
    asyncio.run(main())

