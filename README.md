# RaceHub

A self-hosted motorsport dashboard: every racing series' **schedule**, **results**, and **AI-curated news** in one place, with easy filters and per-account saved defaults.

## Stack

| Layer    | Tech                                                              |
| -------- | ---------------------------------------------------------------- |
| Web      | Next.js (App Router, React 19, TypeScript) + Tailwind CSS v4      |
| Auth     | Auth.js (credentials, JWT sessions) — accounts sync prefs        |
| Database | PostgreSQL 17 + Drizzle ORM                                       |
| Worker   | Node + node-cron — ICS schedule ingestion + RSS→OpenRouter news  |
| Infra    | Docker Compose (db / web / worker)                               |

Monorepo via npm workspaces:

```
packages/db      # Drizzle schema, client, series registry, migrate + seed
apps/web         # Next.js site
apps/worker      # ingestion cron (schedules + news)
```

## Quick start (Docker)

```bash
cp .env.example .env
# Edit .env: set AUTH_SECRET (openssl rand -base64 32), POSTGRES_PASSWORD,
# and OPENROUTER_API_KEY if you want AI news now.

docker compose up -d --build      # starts db, web, worker

# First-time DB setup (generate migration SQL, apply, seed series):
docker compose exec web sh -lc "cd /app && npm run db:generate && npm run db:migrate && npm run db:seed"
```

Open http://localhost:3000.

> The worker logs "No series have an icsUrl configured yet" until you add calendar
> feeds — that's expected on a fresh install. See **Adding schedules** below.

## Local dev (without Docker)

```bash
# Start just Postgres in Docker:
docker compose up -d db

# Point DATABASE_URL at localhost (see commented line in .env), then:
npm install
npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev:web          # http://localhost:3000
npm run dev:worker       # ingestion loop (separate terminal)
```

## Adding schedules

Two ways to populate events:

1. **ICS calendar feeds (automatic).** Add an `icsUrl` to a series in
   `packages/db/src/series.ts`, re-run `npm run db:seed`, and the worker picks it
   up on its next run (or run it now: `docker compose exec worker npm run ingest:schedules`).
   Ingestion is idempotent — keyed on the calendar UID, so re-runs update in place.

2. **Manual entry.** Insert rows directly into `events` (and optionally
   `event_sessions` / `results`). A small admin UI is a planned follow-up.

## AI news (OpenRouter)

Add a `feedUrl` (RSS/Atom) to a series in `series.ts`, set `OPENROUTER_API_KEY`
(and optionally `OPENROUTER_MODEL`, default `anthropic/claude-3.5-haiku`) in
`.env`. The worker fetches each feed, summarises items via OpenRouter, dedupes,
and stores them. Without a key it still ingests headlines, just without summaries.

Run once on demand: `docker compose exec worker npm run ingest:news`.

## Cron schedules

Set in `.env`: `INGEST_CRON` (default every 6h) and `NEWS_CRON` (default hourly).
The worker also runs both once on boot.

## Useful commands

```bash
npm run db:studio     # Drizzle Studio (browse the DB)
docker compose logs -f worker
docker compose exec worker npm run ingest:schedules
```
