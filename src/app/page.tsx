import Link from "next/link";
import {
  getCompany,
  getInitiatives,
  summarizePortfolio,
} from "@/lib/queries";
import { velocityTrend } from "@/lib/insights";
import {
  HealthBadge,
  ProgressBar,
  StatCard,
  TeamChip,
  Trend,
  SectionTitle,
} from "@/components/ui";
import { OutcomeRow } from "@/components/Outcome";
import { fmtMetric } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const [company, initiatives] = await Promise.all([
    getCompany(),
    getInitiatives(),
  ]);
  const s = summarizePortfolio(initiatives);
  const trend = velocityTrend({
    velocityLast7: s.velocityLast7,
    velocityPrev7: s.velocityPrev7,
  } as any);

  return (
    <div>
      <header className="mb-8">
        <div className="text-sm text-brand-soft">{company?.period} · Portfolio</div>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          {company?.name} — outcomes everyone can see
        </h1>
        {company?.mission && (
          <p className="mt-2 max-w-3xl text-sm text-slate-400">{company.mission}</p>
        )}
      </header>

      {/* Portfolio vitals */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Initiatives"
          value={s.initiativeCount}
          sub={`${s.projectCount} projects in flight`}
        />
        <StatCard
          label="Avg outcome progress"
          value={`${s.avgOutcomeProgress}%`}
          sub={`${s.totalOutcomes} success metrics tracked`}
          tone={s.avgOutcomeProgress >= 50 ? "good" : "warn"}
        />
        <StatCard
          label="Need attention"
          value={s.offTrackInitiatives + s.atRiskInitiatives}
          sub={`${s.offTrackInitiatives} off track · ${s.atRiskInitiatives} at risk`}
          tone={s.offTrackInitiatives > 0 ? "bad" : s.atRiskInitiatives > 0 ? "warn" : "good"}
        />
        <StatCard
          label="Weekly velocity"
          value={
            <span>
              {s.velocityLast7} <Trend trend={trend} />
            </span>
          }
          sub={`pts done · ${s.blockedTasks} blocked, ${s.overdueTasks} overdue`}
          tone={s.blockedTasks + s.overdueTasks > 5 ? "warn" : "default"}
        />
      </div>

      {(s.driftCount > 0 || s.staleTasks > 0) && (
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {s.driftCount > 0 && (
            <Link
              href="/insights"
              className="card flex items-center gap-2 px-3 py-2 text-amber-300 hover:border-amber-500/40"
            >
              ⚠ {s.driftCount} project(s) reported healthier than the data
              suggests — review in the weekly check-in.
            </Link>
          )}
          {s.staleTasks > 0 && (
            <div className="card px-3 py-2 text-slate-400">
              {s.staleTasks} task(s) haven&apos;t moved in 10+ days.
            </div>
          )}
        </div>
      )}

      {/* Initiative board */}
      <div className="mt-10">
        <SectionTitle
          action={
            <Link href="/insights" className="btn btn-primary text-xs">
              ✦ Run weekly check-in
            </Link>
          }
        >
          Strategic initiatives
        </SectionTitle>

        <div className="grid gap-4 lg:grid-cols-2">
          {initiatives.map((init) => (
            <Link
              key={init.id}
              href={`/initiatives/${init.id}`}
              className="card group block p-5 transition hover:border-brand/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-brand-soft">
                    {init.name}
                  </h3>
                  {init.owner && (
                    <div className="mt-0.5 text-xs text-slate-500">
                      Owner: {init.owner}
                    </div>
                  )}
                </div>
                <HealthBadge health={init.health} />
              </div>

              {init.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                  {init.description}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span className="label">Outcome progress</span>
                <span className="font-medium text-slate-300">
                  {init.outcomesProgress}%
                </span>
              </div>
              <ProgressBar
                pct={init.outcomesProgress}
                className="mt-1.5"
                color={
                  init.outcomesProgress >= 60
                    ? "#34d399"
                    : init.outcomesProgress >= 30
                      ? "#fbbf24"
                      : "#fb7185"
                }
              />

              {/* Top success metrics preview */}
              <div className="mt-3 space-y-1.5">
                {init.outcomes.slice(0, 3).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="truncate text-slate-400">{o.name}</span>
                    <span className="ml-2 shrink-0 tabular-nums text-slate-300">
                      {fmtMetric(o.current, o.metricType, o.unit)}{" "}
                      <span className="text-slate-600">→ {o.progress}%</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                <span className="text-xs text-slate-500">
                  {init.projects.length} projects ·
                </span>
                {init.teams.map((t) => (
                  <TeamChip key={t.id} team={t} />
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
