# 🏁 RaceHub

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38-c5f742?style=flat-square)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker Compose](https://img.shields.io/badge/Docker-Supported-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)

**RaceHub** is an open-source, self-hosted motorsport dashboard and intelligence platform. It aggregates schedules, session-level event timing, race results, and AI-curated news across global racing series into a unified, responsive interface with automatic timezone localization and per-user preference sync.

---

## 🌟 Key Features

- 📅 **Unified Event & Session Timelines**: Group sessions (Practice, Qualifying, Sprint, Race, Warmup) into race weekends with real-time countdown timers.
- 🎯 **Session Kind Filtering**: Filter homepage and series views by specific session types (e.g. view only main Races or Qualifying sessions).
- 📰 **AI Motorsport News Summarizer**: Automatically ingests per-series RSS feeds and generates clean summaries via OpenRouter (using Anthropic Claude or models of your choice).
- 🛡️ **Built-in /admin Panel**: Email-allowlisted administration interface (`ADMIN_EMAILS`) for creating, editing, and deleting events, as well as drag-and-drop `.ics` calendar imports.
- 🔄 **Automated Ingestion Worker**: Background ingestion service for public ICS feeds, custom HTML scraping (e.g., GT World Challenge series), and news syndication.
- 🌍 **Multi-Series Coverage**: Out-of-the-box support for Formula 1, F2, F3, IndyCar, Formula E, WEC, IMSA, WRC, GTWC, NASCAR, Supercars, DTM, BTCC, Super Formula, and more.
- 🔐 **User Accounts & Preference Sync**: Credentials-based authentication powered by Auth.js to save default series filters and session display preferences across devices.
- 🌐 **Cloudflare Tunnel Ready**: Included `cloudflared` Docker service block for effortless, secure remote exposure without open ports.

---

## 🏗️ Architecture & Monorepo Structure

RaceHub is structured as a TypeScript monorepo using npm workspaces:

```
racehub/
├── apps/
│   ├── web/            # Next.js 15 (App Router) web application & /admin panel
│   └── worker/         # Background cron worker for schedule & news ingestion
├── packages/
│   └── db/             # Shared PostgreSQL schema, Drizzle ORM models, & seed definitions
├── docker-compose.yml  # Production multi-container setup (db, web, worker, cloudflared)
├── .env.example        # Environment variable template
└── README.md
```

### Tech Stack Breakdown

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Web Framework** | Next.js 15, React 19 | Server Components, Server Actions, App Router |
| **Styling** | Vanilla CSS + Tailwind CSS v4 | Dark mode design system with responsive layouts |
| **Database** | PostgreSQL 17 | Relational storage for series, events, sessions, results, users |
| **ORM** | Drizzle ORM | Type-safe schema definition and query builder |
| **Auth** | Auth.js (NextAuth v5 beta) | Credentials authentication & JWT session management |
| **Worker Ingestion** | Node.js, `node-cron`, `node-ical` | ICS calendar parsing, HTML scraping, RSS feed parsing |
| **AI News Engine** | OpenRouter API | Automated headline summarization |
| **Deployment** | Docker Compose | Containerized database, web app, worker, and tunnel |

---

## 🏎️ Supported Motorsport Series

Out of the box, RaceHub includes seed definitions and calendar ingestion for:

- **Single Seater**: Formula 1 (`f1`), FIA Formula 2 (`f2`), FIA Formula 3 (`f3`), NTT IndyCar Series (`indycar`), FIA Formula E (`formula-e`), Super Formula (`super-formula`).
- **Endurance & GT**: FIA WEC (`wec`), IMSA WeatherTech SportsCar Championship (`imsa`), European Le Mans Series (`elms`), GT World Challenge (`gt-world-challenge` - America, Europe, Asia, Australia).
- **Stock Car & Touring**: NASCAR Cup / Xfinity / Craftsman Trucks, Supercars Championship (`supercars`), BTCC (`btcc`), DTM (`dtm`).
- **Rally**: FIA World Rally Championship (`wrc`).

---

## 🚀 Quick Start (Docker)

The fastest way to get RaceHub up and running is using Docker Compose:

### 1. Clone the Repository & Configure `.env`

```bash
git clone https://github.com/brox07/racehub.git
cd racehub

cp .env.example .env
```

Edit `.env` to configure your credentials:
- Set `AUTH_SECRET` (generate with `openssl rand -base64 32`).
- Set `POSTGRES_PASSWORD`.
- Set `ADMIN_EMAILS` (comma-separated list of emails granted access to `/admin`).
- (Optional) Set `OPENROUTER_API_KEY` to enable AI news summarization.

### 2. Launch Containers

```bash
docker compose up -d --build
```

### 3. Run Database Migrations & Seed Data

```bash
docker compose exec racehub sh -lc "cd /app && npm run db:generate && npm run db:migrate && npm run db:seed"
```

Access the dashboard at [http://localhost:3000](http://localhost:3000).

---

## 💻 Local Development (without Docker)

If you prefer to run the Node services directly on your host machine:

1. **Start PostgreSQL in Docker**:
   ```bash
   docker compose up -d db
   ```

2. **Configure `.env`**:
   Update `DATABASE_URL` in `.env` to point to `localhost`:
   ```env
   DATABASE_URL=postgres://racehub:change-me-in-prod@localhost:5432/racehub
   ```

3. **Install Dependencies & Initialize Database**:
   ```bash
   npm install
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. **Start Development Servers**:
   ```bash
   # Terminal 1: Next.js Web App
   npm run dev:web

   # Terminal 2: Ingestion Worker
   npm run dev:worker
   ```

---

## 🔧 Core Workflows & Features

### 📅 Automatic Schedule Ingestion

Schedule feeds are refreshed periodically by the worker service according to `INGEST_CRON` (default: every 6 hours):
- **ICS Feeds**: The worker downloads public `.ics` files configured in `packages/db/src/series.ts`, parses VEVENTs, groups them into race weekends, and idempotently upserts events and child sessions.
- **Web Scraping**: Custom scrapers (such as `apps/worker/src/ingest-gtwc.ts`) extract race calendars directly from official websites where ICS feeds are unavailable.

To trigger schedule ingestion manually:
```bash
docker compose exec worker npm run ingest:schedules
```

### 📰 AI News Summarization Engine

The worker periodically fetches RSS/Atom feeds for configured series according to `NEWS_CRON` (default: hourly):
- Deduplicates news items against the database.
- Passes article excerpts to OpenRouter (default model: `anthropic/claude-3.5-haiku`).
- Stores bullet-point summaries in PostgreSQL for instant display on the `/news` page.

To trigger news ingestion manually:
```bash
docker compose exec worker npm run ingest:news
```

### 🛡️ Admin Panel & Manual ICS Imports

Users with emails listed in `ADMIN_EMAILS` will see an **Admin** link in the navigation bar. Navigating to `/admin` allows:
- **Event Management**: Manually create, edit, or remove race weekends, circuits, dates, and official URLs.
- **ICS Import**: Drag-and-drop any `.ics` schedule file to instantly import or update events for a selected series.

---

## 📄 Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgres://racehub:change-me-in-prod@db:5432/racehub` | PostgreSQL connection string |
| `POSTGRES_USER` | `racehub` | PostgreSQL database user |
| `POSTGRES_PASSWORD` | `change-me-in-prod` | PostgreSQL password |
| `POSTGRES_DB` | `racehub` | PostgreSQL database name |
| `WEB_PORT` | `3000` | Port for the Next.js web application |
| `AUTH_SECRET` | *(Required in Prod)* | Auth.js secret key (`openssl rand -base64 32`) |
| `ADMIN_EMAILS` | `""` | Comma-separated allowlist of admin user emails |
| `OPENROUTER_API_KEY` | `""` | OpenRouter API Key for AI news summarization |
| `OPENROUTER_MODEL` | `anthropic/claude-3.5-haiku` | AI model to use for news summaries |
| `INGEST_CRON` | `0 */6 * * *` | Cron schedule for schedule ingestion |
| `NEWS_CRON` | `0 * * * *` | Cron schedule for news summarization |
| `CLOUDFLARE_TUNNEL_TOKEN` | `""` | Token for Cloudflare Tunnel remote access |

---

## 🛠️ Monorepo Commands Reference

```bash
# Database management
npm run db:generate   # Generate Drizzle migration files
npm run db:migrate    # Run pending database migrations
npm run db:seed       # Seed motorsport series definitions
npm run db:studio     # Launch Drizzle Studio DB viewer

# Service dev launchers
npm run dev:web       # Start Web App dev server
npm run dev:worker    # Start Worker dev server
```

---

## 🤝 Contributing & License

Contributions are welcome! Feel free to open issues or submit pull requests to add new series feeds, scrapers, or UI enhancements.

Distributed under the MIT License.
