# Outcomes Log

A high-level log of **what shipped** and the value it delivered — at the
outcome/impact level, not commit-by-commit. Most recent first.

**How to add a row:** when a build delivers user-visible value, prepend a row
with the date, a short outcome title, the impact, and status. Keep it
impact-level (what changed for the user), not a list of commits. See `CLAUDE.md`
for the standing convention.

| Date | Outcome | Impact | Status |
|------|---------|--------|--------|
| 2026-06-03 | Create / edit / delete tasks on the board | Each column has "+ Add task"; cards have edit & delete; tasks persist per project (localStorage) and get a TASK-n id | Shipped |
| 2026-06-03 | Drag-and-drop task board | Tasks on the project detail can be dragged between columns (To do / In progress / Blocked / Done) with drop-target highlighting | Shipped |
| 2026-06-03 | Connect projects to initiatives in the form | Create/edit project now has an Initiative picker; selecting one shows the success metrics the project will contribute to | Shipped |
| 2026-06-03 | Clear project alignment & impact panel | Project pages now show what the project is focused on — the initiative, why it matters, the project's specific impact, and the initiative's success metrics it contributes to | Shipped |
| 2026-06-03 | Deadlines & alignment made visible | Every project shows its deadline + countdown and a time-elapsed-vs-work-done schedule check; projects with no initiative are flagged "Unaligned" | Shipped |
| 2026-06-03 | Team filter on Projects (shareable) | Filter projects by team from the top of the page; the filter is saved in the URL so the link remembers it | Shipped |
| 2026-06-03 | Tracking IDs + roadmap calendar view | Initiatives/projects/tasks get readable IDs (PRJ-1…); new "Calendar" view shows projects by month (Q1–Q4) and the view is shareable via the URL | Shipped |
| 2026-06-03 | Compact sidebar + interactive project CRUD | Collapsible icon-rail nav (lucide icons); users can create, edit, and delete projects in-app (saved per browser, $0 static) | Shipped |
| 2026-06-03 | Project ownership & accountability | Each project now shows a single accountable owner (DRI) plus cross-functional point people with RACI roles — answers "who owns this / who to point at" | Shipped |
| 2026-06-02 | PM Suite v0.1 shipped end-to-end | Portfolio / initiatives / projects / teams / weekly-check-in views; alignment-first data model; shared outcome layer everyone can read; deterministic insights + health-drift detection; AI weekly check-in with deterministic fallback; interactive demo seed; swappable single data seam | Shipped & verified — production build passes, all routes 200, check-in + task APIs work, validation returns 400s |
| 2026-06-02 | Living project notes added | `docs/DESIGN_DECISIONS.md` + `docs/OUTCOMES_LOG.md` (table format) and a `CLAUDE.md` convention so every future build keeps both notes current | Shipped |
