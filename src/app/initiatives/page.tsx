import Link from "next/link";
import { getInitiatives } from "@/lib/queries";
import { HealthBadge, ProgressBar, TeamChip } from "@/components/ui";
import { OutcomeRow } from "@/components/Outcome";


export default async function InitiativesPage() {
  const initiatives = await getInitiatives();
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Initiatives</h1>
        <p className="mt-1 text-sm text-slate-400">
          Strategic bets aligned to company needs, with the success metrics each
          one is accountable for.
        </p>
      </header>

      <div className="space-y-4">
        {initiatives.map((init) => (
          <div key={init.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/initiatives/${init.id}`}
                    className="text-lg font-semibold text-white hover:text-brand-soft"
                  >
                    {init.name}
                  </Link>
                  <HealthBadge health={init.health} />
                </div>
                {init.rationale && (
                  <p className="mt-1 max-w-2xl text-sm text-slate-400">
                    <span className="text-slate-500">Why: </span>
                    {init.rationale}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-white">
                  {init.outcomesProgress}%
                </div>
                <div className="label">outcomes</div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="divide-y divide-line">
                {init.outcomes.map((o) => (
                  <OutcomeRow key={o.id} outcome={o} />
                ))}
              </div>
              <div>
                <div className="label mb-2">Delivery projects</div>
                <div className="space-y-2">
                  {init.projects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-overlay/40 px-3 py-2 text-sm hover:border-brand/40"
                    >
                      <span className="min-w-0 truncate text-slate-200">
                        {p.name}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {p.team && <TeamChip team={p.team} />}
                        <span className="w-16">
                          <ProgressBar
                            pct={p.metrics.completionPct}
                            color={p.team?.color}
                          />
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
