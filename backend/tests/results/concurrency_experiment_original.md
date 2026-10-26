# Original concurrent voting experiment

Run time (Europe/Moscow): 2026-10-26T17:25:45+03:00
Git commit: `27032be7d714ea303d47a98c30599e78ff9183de`
Source: detached checkout of the pre-fix commit
Python: 3.12.14
FastAPI: 0.115.12
SQLAlchemy: 2.0.41
HTTPX: 0.28.1
PostgreSQL: PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2) on x86_64-pc-linux-gnu, compiled by gcc (Debian 14.2.0-19) 14.2.0, 64-bit

The measured interval contains only the concurrent HTTP vote requests. User and poll preparation is excluded.

| Participants | Runs consistent | Successful / sent | Mean batch, ms | Min–max, ms | Request median, ms | Request p95, ms | Throughput, req/s | Max counter mismatch |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2 | 1/10 | 20/20 | 29.12 | 19.94–87.13 | 20.64 | 63.16 | 68.68 | 1/1 |
| 10 | 0/10 | 100/100 | 206.47 | 183.46–251.35 | 175.06 | 230.46 | 48.43 | 8/8 |
| 20 | 0/10 | 200/200 | 396.47 | 377.72–413.57 | 338.84 | 393.31 | 50.44 | 18/18 |
| 50 | 0/10 | 500/500 | 662.45 | 623.66–704.43 | 493.12 | 651.84 | 75.48 | 47/47 |

Counter mismatch is reported as `ballots - participant_count` / `ballots - vote_count`.
Every run is consistent only when all requests succeed and ballots, participant_count, and vote_count equal the requested participant count.
