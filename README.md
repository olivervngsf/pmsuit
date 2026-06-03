# PM Suite

A project-management dashboard built around **alignment**, not just task lists.
It connects company strategy → measurable outcomes → cross-functional teams →
delivery projects, and uses Claude to run **AI weekly check-ins** that are
grounded in real metrics.

> The suite ships with realistic **fake** people, teams, initiatives, and
> projects so it's fully interactive out of the box. Everything is designed to
> be swapped for real data with a single, well-defined seam (see
> [Swapping in real data](#swapping-in-real-data)).

## What it does

- **Portfolio view** (`/`) — every strategic initiative with its outcome
  progress, health, and contributing teams. The "what does success look like"
  layer anyone in the company can read.
- **Initiatives** (`/initiatives`) — strategic bets aligned to company needs,
  each with **success metrics (OKR-style outcomes)** owned by a team, plus the
  delivery projects that ladder up to them.
- **Projects** (`/projects`) — execution detail: a click-to-advance task board,
  milestones, velocity, and an **impact** statement that rolls up to the
  initiative. Tasks stay team-internal; outcomes are shared.
- **Teams** (`/teams`) — Marketing, Design, Engineering, Product, Data — the
  people, the outcomes they own, and their projects.
- **Weekly check-in** (`/insights`) — one click generates this week's status for
  every initiative: summary, highlights, risks, and the most leveraged next
  steps, written for cross-functional readers.

### Insights that catch problems early

A deterministic engine (`src/lib/insights.ts`) computes velocity, overdue/stale
work, blocked items, milestone slips, and outcome progress — then **independently
suggests a health status** and flags **"health drift"** when a project is
reported rosier than the data supports. These same numbers ground every AI
check-in, so the narrative can never hallucinate the state of the work.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Prisma** ORM on **SQLite** (zero-config; Postgres-portable)
- **Tailwind CSS**
- **Claude API** (`@anthropic-ai/sdk`) for weekly check-ins, with a deterministic
  fallback when no key is present

## Getting started

```bash
npm install            # installs deps + generates the Prisma client
cp .env.example .env    # configure DATABASE_URL (and optionally your API key)
npm run db:push         # create the SQLite schema
npm run db:seed         # load the demo data (fake people & projects)
npm run dev             # http://localhost:3000
```

Handy scripts:

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also runs `prisma generate`) |
| `npm run db:reset` | Wipe + reseed the database |
| `npm run db:studio` | Browse the data in Prisma Studio |

## Enabling AI weekly check-ins

The weekly check-in works **with or without** an API key:

- **No key** → a deterministic, rule-based summary (clearly labeled "Fallback").
  Great for demos and CI.
- **With a key** → Claude writes the narrative, grounded in the same metrics.

Add to `.env`:

```bash
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-sonnet-4-6"   # optional override
```

The system prompt is cached (`cache_control`) so a full weekly run across many
initiatives is fast and cheap. See `src/lib/ai.ts`.

## Swapping in real data

The app **never** hardcodes data. Every page and API route reads through the
typed query layer in **`src/lib/queries.ts`**, and all demo content lives in
**`prisma/seed.ts`** (clearly marked as fake). To go live:

1. Point `DATABASE_URL` at a real database (e.g. Postgres — change the
   `datasource` provider in `prisma/schema.prisma`).
2. Replace the seed with an import from your source of truth (Jira, Linear, a
   CSV, an internal API) that writes the same Prisma models — **or**
   reimplement the functions in `src/lib/queries.ts` to read from that source
   directly. Keep the return shapes and the entire UI works unchanged.

The data model (`prisma/schema.prisma`) is documented inline and mirrors the
alignment hierarchy:

```
Company → Initiative → Outcome (success metric, team-owned)
                    └→ Project (impact) → Task / Milestone
CheckIn → Project | Initiative   (weekly status, AI or manual)
```

## Project notes

Three living docs are maintained as part of every build (see `CLAUDE.md`):

- [`docs/DESIGN_DECISIONS.md`](docs/DESIGN_DECISIONS.md) — the *why* behind the
  architecture, as a running table of decisions.
- [`docs/OUTCOMES_LOG.md`](docs/OUTCOMES_LOG.md) — the *what shipped*, as a
  dated, impact-level table.
- [`docs/BUILD_TRACKER.md`](docs/BUILD_TRACKER.md) — system state by area
  (foundation, app shell, features, design debts), as a table.

## Project layout

```
docs/
  DESIGN_DECISIONS.md  # running table of design decisions (the "why")
  OUTCOMES_LOG.md      # dated table of high-level outcomes (the "what")
  BUILD_TRACKER.md     # system state by area + known debts
prisma/
  schema.prisma        # data model (the alignment hierarchy)
  seed.ts              # DEMO data — the only place fake content lives
src/
  app/                 # App Router pages + API routes
    api/checkins/…     # POST → generate & persist a weekly check-in
    api/tasks/[id]/…   # PATCH → advance a task's status
  components/          # UI (server) + interactive client components
  lib/
    db.ts              # Prisma client singleton
    insights.ts        # deterministic metrics & health engine (pure functions)
    queries.ts         # THE data-access seam — re-point this at real data
    ai.ts              # Claude integration + deterministic fallback
    checkin-service.ts # builds grounded context, generates & saves check-ins
```
