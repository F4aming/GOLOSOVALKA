from __future__ import annotations

import asyncio
import os
import socket
import subprocess
import time
import uuid
from collections import Counter
from collections.abc import Iterator
from dataclasses import dataclass
from urllib.parse import urlsplit, urlunsplit

import httpx
import psycopg2
import pytest


DATABASE_URL = os.environ.get("DATABASE_URL", "")


def _database_name(url: str) -> str:
    return urlsplit(url.replace("postgresql+asyncpg://", "postgresql://", 1)).path.lstrip("/")


def _sync_database_url(url: str) -> str:
    parsed = urlsplit(url.replace("postgresql+asyncpg://", "postgresql://", 1))
    return urlunsplit(("postgresql", parsed.netloc, parsed.path, parsed.query, parsed.fragment))


def _free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


@pytest.fixture(scope="session")
def api_url() -> Iterator[str]:
    if not DATABASE_URL:
        pytest.fail("DATABASE_URL must point to a dedicated PostgreSQL test database")
    database_name = _database_name(DATABASE_URL)
    if not database_name.endswith("_test"):
        pytest.fail(
            f"Refusing to modify database {database_name!r}; its name must end with '_test'"
        )

    environment = os.environ.copy()
    environment["DATABASE_URL"] = DATABASE_URL
    environment.setdefault("JWT_SECRET", "integration-test-only-secret")
    subprocess.run(
        [os.sys.executable, "-m", "alembic", "upgrade", "head"],
        check=True,
        env=environment,
    )

    port = _free_port()
    process = subprocess.Popen(
        [
            os.sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
            "--log-level",
            "warning",
        ],
        env=environment,
    )
    base_url = f"http://127.0.0.1:{port}"
    try:
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            if process.poll() is not None:
                pytest.fail(f"Uvicorn exited during startup with code {process.returncode}")
            try:
                if httpx.get(f"{base_url}/health", timeout=0.5).status_code == 200:
                    break
            except httpx.TransportError:
                pass
            time.sleep(0.1)
        else:
            pytest.fail("Uvicorn did not become ready within 15 seconds")
        yield f"{base_url}/api/v1"
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)


@pytest.fixture(autouse=True)
def clean_database(api_url: str) -> Iterator[None]:
    del api_url

    def truncate() -> None:
        with psycopg2.connect(_sync_database_url(DATABASE_URL)) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "TRUNCATE poll_ballots, poll_options, poll_questions, polls, users CASCADE"
                )

    truncate()
    try:
        yield
    finally:
        truncate()


def _register(api_url: str, label: str) -> str:
    response = httpx.post(
        f"{api_url}/auth/register",
        json={
            "email": f"{label}-{uuid.uuid4().hex}@example.com",
            "password": "integration-password",
        },
        timeout=10,
    )
    assert response.status_code == 201, response.text
    return response.json()["access_token"]


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _create_poll(api_url: str, token: str) -> str:
    response = httpx.post(
        f"{api_url}/polls/simple",
        headers=_headers(token),
        json={
            "question": "Concurrent voting test",
            "options": ["Yes", "No"],
            "multiple_choice": False,
            "allow_vote_cancellation": False,
        },
        timeout=10,
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


@dataclass(frozen=True)
class DatabaseCounts:
    participants: int
    option_votes: int
    ballots: int


def _database_counts(poll_id: str) -> DatabaseCounts:
    with psycopg2.connect(_sync_database_url(DATABASE_URL)) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT participant_count FROM polls WHERE id = %s", (poll_id,))
            participants = cursor.fetchone()[0]
            cursor.execute(
                """
                SELECT po.vote_count
                FROM poll_options po
                JOIN poll_questions pq ON pq.id = po.question_id
                WHERE pq.poll_id = %s AND po.position = 0
                """,
                (poll_id,),
            )
            option_votes = cursor.fetchone()[0]
            cursor.execute("SELECT count(*) FROM poll_ballots WHERE poll_id = %s", (poll_id,))
            ballots = cursor.fetchone()[0]
    return DatabaseCounts(participants, option_votes, ballots)


async def _vote_once(client: httpx.AsyncClient, poll_id: str, token: str) -> int:
    response = await client.post(
        f"/public/polls/{poll_id}/vote",
        headers=_headers(token),
        json={"option_indexes": [0]},
    )
    return response.status_code


@pytest.mark.integration
def test_concurrent_votes_from_different_users(api_url: str) -> None:
    voter_count = 20
    owner_token = _register(api_url, "owner")
    poll_id = _create_poll(api_url, owner_token)
    voter_tokens = [_register(api_url, f"voter-{index}") for index in range(voter_count)]

    async def run_votes() -> list[int]:
        async with httpx.AsyncClient(base_url=api_url, timeout=30) as client:
            return await asyncio.gather(
                *(_vote_once(client, poll_id, token) for token in voter_tokens)
            )

    status_counts = Counter(asyncio.run(run_votes()))
    counts = _database_counts(poll_id)
    assert status_counts == Counter({200: voter_count}), (
        f"HTTP statuses: {dict(status_counts)}; database counts: {counts}"
    )
    assert counts == DatabaseCounts(voter_count, voter_count, voter_count)


@pytest.mark.integration
def test_concurrent_duplicate_votes_count_once(api_url: str) -> None:
    token = _register(api_url, "duplicate-concurrent")
    poll_id = _create_poll(api_url, token)

    async def run_votes() -> list[int]:
        async with httpx.AsyncClient(base_url=api_url, timeout=30) as client:
            return await asyncio.gather(
                *(_vote_once(client, poll_id, token) for _ in range(10))
            )

    statuses = asyncio.run(run_votes())
    assert Counter(statuses) == Counter({200: 1, 409: 9}), statuses
    assert _database_counts(poll_id) == DatabaseCounts(1, 1, 1)


@pytest.mark.integration
def test_sequential_duplicate_vote_is_rejected(api_url: str) -> None:
    token = _register(api_url, "duplicate-sequential")
    poll_id = _create_poll(api_url, token)

    first = httpx.post(
        f"{api_url}/public/polls/{poll_id}/vote",
        headers=_headers(token),
        json={"option_indexes": [0]},
        timeout=10,
    )
    second = httpx.post(
        f"{api_url}/public/polls/{poll_id}/vote",
        headers=_headers(token),
        json={"option_indexes": [0]},
        timeout=10,
    )

    assert first.status_code == 200, first.text
    assert second.status_code == 409, second.text
    assert _database_counts(poll_id) == DatabaseCounts(1, 1, 1)
