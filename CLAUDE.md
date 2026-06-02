# CLAUDE.md

Guidance for Claude (and humans) working in this repo.

## What this is

**PM Suite** — an alignment-first project management dashboard. Work is organized
as `Company → Initiative → Outcome (team-owned success metric) → Project →
Task/Milestone`. Outcomes are the shared, cross-team layer everyone can read;
task detail stays on the project board. A deterministic insights engine grounds
an AI weekly check-in (Claude), with a rule-based fallback when no API key is set.

Stack: Next.js 15 (App Router) + TypeScript + Prisma/SQLite + Tailwind.

### Key paths
| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | Data model (the alignment hierarchy) |
| `prisma/seed.ts` | The ONLY place demo/fake data lives |
| `src/lib/queries.ts` | The single data-access seam — re-point at real data here |
| `src/lib/insights.ts` | Deterministic metrics + health/drift engine (pure functions) |
| `src/lib/ai.ts` | Claude integration + deterministic fallback |
| `src/lib/checkin-service.ts` | Builds grounded context, generates & saves check-ins |
| `src/app/` | App Router pages + API routes |

### Common commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (runs `prisma generate`) |
| `npm run db:reset` | Wipe + reseed the database |
| `npm run db:seed` | Load demo data |

## Documentation convention (do it when you build it)

Two living notes are maintained **as part of every build**. Both are markdown
**tables** — keep each cell to roughly one line.

- **`docs/DESIGN_DECISIONS.md`** — when a build makes a non-trivial
  design/architectural choice, append a row with the next `DD-xxx` id
  (Date, Area, Decision, Rationale, Consequences). Captures the *why*.
- **`docs/OUTCOMES_LOG.md`** — when a build delivers user-visible value, prepend
  a dated row (Date, Outcome, Impact, Status). Impact-level, not commit-level.

Update these in the same change as the work they describe, so the repo always
explains why it's built the way it is and what has shipped over time.
