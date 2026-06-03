# Design Decisions

A running log of the **why** behind the PM Suite's architecture and design. Each
row captures one non-trivial decision so anyone (human or a future Claude
session) can understand the reasoning without re-deriving it.

**How to add a row:** append a new line to the table with the next `DD-xxx` id,
today's date, the area it touches, the decision, the rationale, and the
consequences. Keep each cell to roughly one line so the table stays scannable.
See `CLAUDE.md` for the standing convention.

| ID | Date | Area | Decision | Rationale | Consequences |
|----|------|------|----------|-----------|--------------|
| DD-001 | 2026-06-02 | Stack | Next.js 15 (App Router) + TypeScript + Prisma/SQLite + Tailwind | One deployable full-stack app, zero-config DB, fast modern UI | Easy local dev; Vercel-ready; server components read the DB directly |
| DD-002 | 2026-06-02 | Data model | Alignment hierarchy: Company → Initiative → Outcome → Project → Task/Milestone (`prisma/schema.prisma`) | Model company alignment, not just task lists | Strategy ties to execution; richer schema and queries |
| DD-003 | 2026-06-02 | Product | Outcomes are the shared cross-team layer; tasks stay team-internal | Everyone can read "what success looks like" without task noise | Outcome views are portfolio-wide; task board is per-project |
| DD-004 | 2026-06-02 | Code | Enums stored as strings + presentation metadata centralized in `src/lib/types.ts` | SQLite-friendly; keep labels/colors consistent across the UI | No DB-level enums; one place to change status styling |
| DD-005 | 2026-06-02 | Insights | Deterministic engine (`src/lib/insights.ts`) with an independent health signal + "health drift" detection | Catch rosy self-reports; give the AI grounded numbers | Drift surfaced on dashboards; insights are pure/testable |
| DD-006 | 2026-06-02 | AI | Claude check-ins grounded in metrics, with a rule-based fallback when no API key (`src/lib/ai.ts`) | Works end-to-end with or without a key; never hallucinates state | Demo/CI-safe; richer narratives once a key is added |
| DD-007 | 2026-06-02 | Architecture | Single data-access seam (`src/lib/queries.ts`); all demo data isolated in `prisma/seed.ts` | Swap fake → real data without touching the UI | Going live = re-point one layer; pages unchanged |
| DD-008 | 2026-06-02 | AI | Prompt caching (`cache_control`) on the system prompt; model via `ANTHROPIC_MODEL` env | Cheap/fast full weekly runs; configurable model | Lower cost at scale; easy model upgrades |
| DD-009 | 2026-06-02 | Data | SQLite now, but a Postgres-portable schema | Zero-config dev with a clean migration path | Only the datasource provider changes to migrate later |
| DD-010 | 2026-06-02 | Seed | Backdate `updatedAt` via raw SQL in the seed | `@updatedAt` can't be set on create; needed to make "stale" tasks realistic | Demo shows true stale signals; uses `$executeRawUnsafe` |
| DD-011 | 2026-06-02 | Security | Pin Next to patched `15.5.19` (CVE-2025-66478); upgrade `@anthropic-ai/sdk` to `^0.100.1` | Resolve the advisory; enable `cache_control` typing | Stays on supported, secure versions |
| DD-012 | 2026-06-03 | Data model | Project ownership = one accountable `owner` (DRI) + `ProjectContributor` rows (team + point person + RACI role) | A cross-functional project (e.g. a campaign) needs one throat to choke plus a point person per function | Clear "who to point at"; supports many teams per project |
| DD-013 | 2026-06-03 | Architecture | Create/edit/delete via a localStorage overlay (`useLocalStore`) seeded from the static build, not a backend | Keeps the demo $0 and fully static while still being interactive | Edits are per-browser, not shared; swap the hook for an API to go multi-user |
| DD-014 | 2026-06-03 | App shell | Collapsible icon-rail sidebar (default compact) with `lucide-react` icons | Maximizes content space; matches the requested Teramind-style compact nav | One small icon dependency; state saved per browser |
