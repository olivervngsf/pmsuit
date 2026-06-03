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
| Compact / collapsible sidebar (icon rail) | ✅ | Default compact; toggle to expand; state saved per browser |
| Refined per-tab icons | ✅ | `lucide-react` icons mapped per section |

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
| Client-side CRUD — projects (create/edit/delete) | ✅ | `useLocalStore` overlay; modal forms; per-browser |
| Human-readable tracking IDs (`INIT-`, `PRJ-`, `TASK-`) | ✅ | `key` field; shown on cards, details, board |
| Projects views: Cards / List / Calendar (shareable via URL) | ✅ | `?view=list`/`calendar`; calendar groups by month Q1–Q4 |
| Team filter on Projects (saved in URL, shareable) | ✅ | `?team=…`; applies to grid + calendar + stats |
| Deadline visibility (date + countdown, urgency color) | ✅ | `Deadline` badge on cards & project detail |
| Schedule vs progress (time elapsed vs work done) | ✅ | `scheduleStatus`; flags behind / past deadline |
| Alignment surfaced + "Unaligned" flag (no initiative) | ✅ | `AlignmentChip` on cards & detail |
| Project "Alignment & impact" panel | ✅ | Initiative + why + impact + the success metrics it contributes to |
| Demo seed (fake company / teams / people / work) | ✅ | `prisma/seed.ts` |

## Design Debts (product · design · strategy)

| Debt | Type | Priority | Notes |
|------|------|----------|-------|
| Create/edit/delete UI — projects done; tasks, initiatives, outcomes pending | Product | Med | Projects shipped (client-side localStorage); extend to other entities next |
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

## Research Debts (validate with users before building)

Open questions to clarify with real users. Priority stays **TBD** until we learn
how the workflow actually works; promote once validated.

| Open question | What to clarify with users | Priority | Status |
|---------------|----------------------------|----------|--------|
| When creating a project, should users assign it to an existing initiative **and/or create a new one inline**? | How does this fit their workflow — do PMs define initiatives first (top-down) then add projects, or spin up projects then group them (bottom-up)? Is inline initiative creation worth the added complexity, or is a simple "pick existing" enough? | TBD | 🔍 Open |
| How do users want to see analysis/metrics — scoped to **their own team**, or **org-wide / general**? | Who's the audience (an IC PM vs a head of product/exec)? Which metrics matter (workload counts, health, velocity, deadlines)? Is "this week/month/year" even the right cut, or do they think in quarters/initiatives? Pulled the team week/month/year tiles pending this. | TBD | 🔍 Open |
| How do users want to **see projects, and why**? | What grouping/view drives their decisions — by team, initiative, deadline, owner, or status? What question are they answering when they open the list (what's late? what's mine? what's at risk?)? | TBD | 🔍 Open |

## Others

| Item | Status | Notes |
|------|--------|-------|
| Security: Next pinned to patched 15.5.19 (CVE-2025-66478) | ✅ | |
| Automated tests (unit / e2e) | ⬜ | `insights.ts` is pure & ready to test |
| CI pipeline | ⬜ | None yet |
| Build-tracker maintainer agent | ✅ | `.claude/agents/build-tracker.md` keeps this file current |
| Git commits show "Unverified" on GitHub | ⚠️ | Needs history rewrite + force-push |
| Empty `main` branch cleanup | ⚠️ | Leftover from PR setup |
| PR into `main` | 🟡 | Blocked on force-push authorization |
