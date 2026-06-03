import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getInitiative } from "@/lib/queries";
import {
  HealthBadge,
  ProgressBar,
  StatCard,
  TeamChip,
  SectionTitle,
} from "@/components/ui";
import { OutcomeRow } from "@/components/Outcome";
import { ProjectCard } from "@/components/ProjectCard";
import { RunCheckIn } from "@/components/RunCheckIn";
import { CheckInCard } from "@/components/CheckInCard";
import { fmtDate } from "@/lib/format";

// Pre-render every initiative page at build time (static export).
export async function generateStaticParams() {
  const initiatives = await prisma.initiative.findMany({ select: { id: true } });
  return initiatives.map((i) => ({ id: i.id }));
}

export default async function InitiativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const init = await getInitiative(id);
  if (!init) notFound();

  const checkIns = await prisma.checkIn.findMany({
    where: { initiativeId: id },
    orderBy: { weekOf: "desc" },
    take: 4,
  });

  const drift = init.signal.suggested !== init.health;

  return (
    <div>
      <Link href="/initiatives" className="text-sm text-slate-500 hover:text-slate-300">
        ← Initiatives
      </Link>

      <header className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">{init.name}</h1>
            <HealthBadge health={init.health} />
          </div>
          {init.description && (
            <p className="mt-2 text-sm text-slate-400">{init.description}</p>
          )}
          {init.rationale && (
            <p className="mt-2 text-sm text-slate-500">
              <span className="text-slate-400">Why it matters: </span>
              {init.rationale}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {init.owner && <span>Owner: {init.owner}</span>}
            {init.targetDate && <span>· Target: {fmtDate(init.targetDate)}</span>}
            {init.teams.map((t) => (
              <TeamChip key={t.id} team={t} href={`/teams/${t.slug}`} />
            ))}
          </div>
        </div>
        <RunCheckIn
          type="initiative"
          id={init.id}
          name={init.name}
          label="Run check-in"
          compact
        />
      </header>

      {drift && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          ⚠ Reported <strong>{init.health.replace("_", " ").toLowerCase()}</strong>,
          but signals suggest{" "}
          <strong>{init.signal.suggested.replace("_", " ").toLowerCase()}</strong>:{" "}
          {init.signal.reasons.join("; ")}.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Outcome progress"
          value={`${init.outcomesProgress}%`}
          tone={init.outcomesProgress >= 50 ? "good" : "warn"}
        />
        <StatCard label="Projects" value={init.projects.length} />
        <StatCard
          label="Task completion"
          value={`${init.taskMetrics.completionPct}%`}
          sub={`${init.taskMetrics.done}/${init.taskMetrics.total} done`}
        />
        <StatCard
          label="Needs attention"
          value={init.taskMetrics.blocked + init.taskMetrics.overdue}
          sub={`${init.taskMetrics.blocked} blocked · ${init.taskMetrics.overdue} overdue`}
          tone={
            init.taskMetrics.blocked + init.taskMetrics.overdue > 0
              ? "warn"
              : "good"
          }
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <SectionTitle>Success metrics</SectionTitle>
          <div className="card divide-y divide-line px-4">
            {init.outcomes.map((o) => (
              <OutcomeRow key={o.id} outcome={o} />
            ))}
            {init.outcomes.length === 0 && (
              <div className="py-6 text-sm text-slate-500">
                No outcomes defined yet.
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-3">
          <SectionTitle>Delivery projects</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {init.projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      </div>

      {checkIns.length > 0 && (
        <section className="mt-8">
          <SectionTitle>Recent check-ins</SectionTitle>
          <div className="space-y-3">
            {checkIns.map((c) => (
              <CheckInCard key={c.id} checkIn={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
