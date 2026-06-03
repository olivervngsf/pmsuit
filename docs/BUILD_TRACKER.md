# Build Tracker

A living map of **what's been built**, organized by area, plus the **known debts**
we're carrying. Use it to see the state of the system at a glance and to decide
what to build next.

**How to update:** adjust the status of a row as work lands, or add a new row in
the right section. Keep cells to ~one line. See `CLAUDE.md` for the convention.

**Legend:** ✅ Done · 🟡 In progress · ⬜ Planned / not started · ⚠️ Debt / needs attention

## Foundation & Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Next.js 15 (App Router) + TypeScript scaffold | ✅ | Base app + tooling |
| Prisma ORM + SQLite data layer | ✅ | Schema is Postgres-portable (DD-009) |
| Tailwind theme + design tokens | ✅ | Dark surface palette, shared primitives |
| Static export pipeline (seed-at-build) | ✅ | Dummy data baked in; $0 hosting |
| Deployment (Vercel import) | 🟡 | User importing repo in Vercel dashboard |
| Project-notes convention | ✅ | CLAUDE.md + DESIGN_DECISIONS + OUTCOMES_LOG + this tracker |

## App Shell

| Item | Status | Notes |
|------|--------|-------|
| Root layout + sidebar navigation | ✅ | `src/components/Sidebar.tsx` |
| Global styles: cards, chips, buttons, progress bars | ✅ | `ui.tsx`, `globals.css` |
| Responsive max-width content container | ✅ | `layout.tsx` |
| Mobile navigation (hamburger menu) | ⚠️ | Sidebar hidden below `md`; no menu yet |
| Compact / collapsible sidebar (icon rail) | ⬜ | Requested — Teramind-style expand/collapse |
| Refined per-tab icons | ⬜ | Requested — icon set matched to each section |

## Engineer Built (shipped features)

| Feature | Status | Notes |
|---------|--------|-------|
| Alignment data model (Company → Initiative → Outcome → Project → Task/Milestone) | ✅ | `prisma/schema.prisma` |
| Data-access seam (`queries.ts`) | ✅ | Single point to swap in real data |
| Deterministic insights engine (velocity, overdue/stale/blocked, health drift) | ✅ | `src/lib/insights.ts` (pure functions) |
| Portfolio dashboard | ✅ | `/` — outcomes everyone can see |
| Initiatives: list + detail (success metrics, projects, teams) | ✅ | `/initiatives` |
| Projects: list + detail + task board | ✅ | `/projects` — click-to-advance board |
| Teams: list + detail (people, owned outcomes) | ✅ | `/teams` |
| Weekly check-in (AI + deterministic fallback) | ✅ | `ai.ts`, `checkin-service.ts`, `/insights` |
| Project ownership (DRI + cross-functional RACI contributors) | ✅ | `ProjectContributor` model; shown on project detail |
| Demo seed (fake company / teams / people / work) | ✅ | `prisma/seed.ts` |

## Design Debts (product · design · strategy)

| Debt | Type | Priority | Notes |
|------|------|----------|-------|
| No create / edit / delete UI — data only via seed | Product | High | Requested next — needs a persistence decision (static demo has no backend; see notes) |
| No real-data integration (still dummy) | Product | High | Swap at `queries.ts` / `seed.ts` |
| No auth, multi-tenant, or permissions | Product | High | Single shared view today |
| AI check-ins not persisted in the static build | Product | Med | Static demo shows a sample only |
| Task board is click-to-advance, no drag & drop | Design | Med | Good enough for demo |
| Outcome metric values updated manually | Product | Med | No metric integrations |
| Mobile / responsive navigation incomplete | Design | Med | Sidebar hidden on small screens |
| No trends/charts over time (point-in-time only) | Design | Med | Velocity is 7d vs prior 7d only |
| Empty states / first-run onboarding | Design | Low | Assumes data already exists |
| Accessibility pass (focus order, ARIA, contrast) | Design | Med | Not yet audited |
| Alignment model assumes one company + one period | Strategy | Med | No historical periods / roadmap |
| Initiative ↔ project links are flat (no dependencies) | Strategy | Low | No cross-project sequencing |
| No capacity / resourcing view across teams | Strategy | Low | People exist but aren't load-balanced |

## Others

| Item | Status | Notes |
|------|--------|-------|
| Security: Next pinned to patched 15.5.19 (CVE-2025-66478) | ✅ | |
| Automated tests (unit / e2e) | ⬜ | `insights.ts` is pure & ready to test |
| CI pipeline | ⬜ | None yet |
| Git commits show "Unverified" on GitHub | ⚠️ | Needs history rewrite + force-push |
| Empty `main` branch cleanup | ⚠️ | Leftover from PR setup |
| PR into `main` | 🟡 | Blocked on force-push authorization |
