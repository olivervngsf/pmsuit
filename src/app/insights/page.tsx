import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  getInitiatives,
  summarizePortfolio,
} from "@/lib/queries";
import { isAIConfigured } from "@/lib/ai";
import { WeeklyRunAll } from "@/components/WeeklyRunAll";
import { CheckInCard } from "@/components/CheckInCard";
import { HealthBadge, StatCard, SectionTitle } from "@/components/ui";
import { fmtDate } from "@/lib/format";


export default async function InsightsPage() {
  const initiatives = await getInitiatives();
  const s = summarizePortfolio(initiatives);
  const aiConfigured = isAIConfigured();

  // Build the run list (one check-in per initiative, in priority order).
  const targets = initiatives.map((i) => ({
    type: "initiative" as const,
    id: i.id,
    name: i.name,
  }));

  // Recent saved check-ins across the whole org.
  const recent = await prisma.checkIn.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      project: { select: { name: true, id: true } },
      initiative: { select: { name: true, id: true } },
    },
  });

  // Attention list: projects whose self-reported health is rosier than signals,
  // plus anything blocked/overdue/stale.
  const attention = initiatives
    .flatMap((i) => i.projects)
    .map((p) => ({
      p,
      drift: p.signal.suggested !== p.health,
      issues:
        p.metrics.blocked + p.metrics.overdue + (p.metrics.stale > 0 ? 1 : 0),
    }))
    .filter((x) => x.drift || x.issues > 0)
    .sort((a, b) => b.issues - a.issues);

  return (
    <div>
      <header className="mb-6">
        <div className="text-sm text-brand-soft">✦ AI weekly run</div>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          Weekly check-in
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Generate this week&apos;s status for every initiative in one click.
          Each check-in is grounded in the real metrics below — wins, risks, and
          the most leveraged next steps — written for cross-functional readers.
        </p>
      </header>

      <div className="card p-5">
        <WeeklyRunAll targets={targets} aiConfigured={aiConfigured} />
        {!aiConfigured && (
          <p className="mt-3 text-xs text-slate-500">
            Running in deterministic fallback mode. Add{" "}
            <code className="text-brand-soft">ANTHROPIC_API_KEY</code> to your
            environment to get AI-written narratives from Claude.
          </p>
        )}
      </div>

      {/* Portfolio vitals that ground the run */}
      <div className="mt-8">
        <SectionTitle>This week, by the numbers</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Avg outcome progress"
            value={`${s.avgOutcomeProgress}%`}
            tone={s.avgOutcomeProgress >= 50 ? "good" : "warn"}
          />
          <StatCard
            label="Velocity (7d)"
            value={s.velocityLast7}
            sub={`prev ${s.velocityPrev7} pts`}
          />
          <StatCard
            label="Blocked / overdue"
            value={s.blockedTasks + s.overdueTasks}
            tone={s.blockedTasks + s.overdueTasks > 0 ? "warn" : "good"}
          />
          <StatCard
            label="Health drift"
            value={s.driftCount}
            sub="reported rosier than data"
            tone={s.driftCount > 0 ? "bad" : "good"}
          />
        </div>
      </div>

      {/* Attention list */}
      {attention.length > 0 && (
        <section className="mt-8">
          <SectionTitle>Needs your attention</SectionTitle>
          <div className="card divide-y divide-line">
            {attention.map(({ p, drift }) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-surface-overlay/40"
              >
                <div className="min-w-0">
                  <div className="truncate text-slate-200">{p.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {p.signal.reasons.join(" · ")}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {drift && (
                    <span className="chip bg-amber-500/10 text-amber-300">
                      drift
                    </span>
                  )}
                  <HealthBadge health={p.health} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Saved history */}
      {recent.length > 0 && (
        <section className="mt-8">
          <SectionTitle>Recent check-ins</SectionTitle>
          <div className="space-y-3">
            {recent.map((c) => (
              <div key={c.id}>
                <div className="mb-1 text-xs text-slate-500">
                  {c.initiative ? (
                    <Link
                      href={`/initiatives/${c.initiative.id}`}
                      className="hover:text-slate-300"
                    >
                      ◆ {c.initiative.name}
                    </Link>
                  ) : c.project ? (
                    <Link
                      href={`/projects/${c.project.id}`}
                      className="hover:text-slate-300"
                    >
                      ▦ {c.project.name}
                    </Link>
                  ) : (
                    "—"
                  )}{" "}
                  · {fmtDate(c.createdAt)}
                </div>
                <CheckInCard checkIn={c} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
