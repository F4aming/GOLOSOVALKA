# HTTP integration tests

The tests start a real Uvicorn process, send requests through the HTTP API, and
compare API results with rows and counters stored in PostgreSQL.

Use a dedicated database whose name ends with `_test`. The test fixture refuses
to run against any other database name and truncates all application tables
between tests.

```bash
cd backend
export DATABASE_URL='postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/voting_platform_test'
python -m pip install -r requirements-test.txt
python -m pytest -v
```

The suite applies Alembic migrations automatically before starting the API.
It covers:

- simultaneous votes by different registered users;
- simultaneous duplicate requests from one user;
- a sequential duplicate vote.

The owner creates a poll through the authenticated management API. Voting uses
the public participant endpoint, so registered users can vote in a poll created
by another user. The test exercises concurrent counter updates and verifies
them against `poll_ballots`.
