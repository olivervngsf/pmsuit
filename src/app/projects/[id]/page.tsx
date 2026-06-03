import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getProject } from "@/lib/queries";
import { velocityTrend, scheduleStatus } from "@/lib/insights";
import {
  HealthBadge,
  ProgressBar,
  StatCard,
  TeamChip,
  Trend,
  SectionTitle,
  KeyTag,
  Deadline,
  AlignmentChip,
} from "@/components/ui";
import { TaskBoard } from "@/components/TaskBoard";
import { Ownership } from "@/components/Ownership";
import { RunCheckIn } from "@/components/RunCheckIn";
import { CheckInCard } from "@/components/CheckInCard";
import { fmtShortDate, relativeDays } from "@/lib/format";

// Pre-render every project page at build time (static export).
export async function generateStaticParams() {
  const projects = await prisma.project.findMany({ select: { id: true } });
  return projects.map((p) => ({ id: p.id }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const m = project.metrics;
  const trend = velocityTrend(m);
  const drift = project.signal.suggested !== project.health;
  const schedule = scheduleStatus(
    project.startDate,
    project.targetDate,
    m.completionPct,
  );

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/projects" className="hover:text-slate-300">
          Projects
        </Link>
        {project.initiative && (
          <>
            <span>/</span>
            <Link
              href={`/initiatives/${project.initiative.id}`}
              className="hover:text-slate-300"
            >
              {project.initiative.name}
            </Link>
          </>
        )}
      </div>

      <header className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <KeyTag id={project.key} />
            <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
            <HealthBadge health={project.health} />
          </div>
          {project.impact && (
            <p className="mt-2 text-sm text-slate-300">
              <span className="text-slate-500">Impact: </span>
              {project.impact}
            </p>
          )}
          {project.description && (
            <p className="mt-1.5 text-sm text-slate-400">{project.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Deadline
              date={project.targetDate}
              done={project.status === "COMPLETED"}
            />
            <AlignmentChip initiative={project.initiative} />
            {project.team && (
              <TeamChip team={project.team} href={`/teams/${project.team.slug}`} />
            )}
            {project.lead && <span>Lead: {project.lead}</span>}
          </div>
        </div>
        <RunCheckIn
          type="project"
          id={project.id}
          name={project.name}
          label="Run check-in"
          compact
        />
      </header>

      {drift && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          ⚠ Reported{" "}
          <strong>{project.health.replace("_", " ").toLowerCase()}</strong>, but
          signals suggest{" "}
          <strong>
            {project.signal.suggested.replace("_", " ").toLowerCase()}
          </strong>
          : {project.signal.reasons.join("; ")}.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Completion"
          value={`${m.completionPct}%`}
          sub={`${m.done}/${m.total} tasks`}
        />
        <StatCard
          label="Velocity (7d)"
          value={
            <span>
              {m.velocityLast7} <Trend trend={trend} />
            </span>
          }
          sub={`prev ${m.velocityPrev7} pts`}
        />
        <StatCard
          label="Blocked"
          value={m.blocked}
          tone={m.blocked > 0 ? "bad" : "good"}
        />
        <StatCard
          label="Overdue"
          value={m.overdue}
          tone={m.overdue > 0 ? "warn" : "good"}
        />
      </div>

      {/* Work done vs. time elapsed — is the commitment on track for its date? */}
      <div className="mt-6 space-y-2">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-slate-500">Work done</span>
            <span className="text-slate-400">{m.completionPct}%</span>
          </div>
          <ProgressBar pct={m.completionPct} color={project.team?.color} />
        </div>
        {schedule && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-500">Time elapsed</span>
              <span
                className={
                  schedule.behind ? "text-rose-300" : "text-emerald-300"
                }
              >
                {schedule.elapsedPct}% · {schedule.label}
              </span>
            </div>
            <ProgressBar
              pct={schedule.elapsedPct}
              color={schedule.behind ? "#fb7185" : "#475569"}
            />
          </div>
        )}
      </div>

      <section className="mt-8">
        <SectionTitle>Ownership &amp; accountability</SectionTitle>
        <Ownership owner={project.owner} contributors={project.contributors} />
      </section>

      <section className="mt-8">
        <SectionTitle>Tasks</SectionTitle>
        <TaskBoard tasks={project.tasks} />
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {project.milestones.length > 0 && (
          <section>
            <SectionTitle>Milestones</SectionTitle>
            <div className="card divide-y divide-line">
              {project.milestones.map((ms) => {
                const overdue =
                  ms.status === "MISSED" ||
                  (ms.status === "UPCOMING" && ms.dueDate < new Date());
                return (
                  <div
                    key={ms.id}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="text-slate-200">{ms.name}</span>
                    <span
                      className={
                        ms.status === "COMPLETED"
                          ? "text-emerald-400"
                          : overdue
                            ? "text-rose-400"
                            : "text-slate-400"
                      }
                    >
                      {fmtShortDate(ms.dueDate)} · {relativeDays(ms.dueDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="lg:col-span-2">
          <SectionTitle>Weekly check-ins</SectionTitle>
          {project.checkIns.length > 0 ? (
            <div className="space-y-3">
              {project.checkIns.map((c) => (
                <CheckInCard key={c.id} checkIn={c} />
              ))}
            </div>
          ) : (
            <div className="card p-5 text-sm text-slate-500">
              No check-ins yet. Use{" "}
              <span className="text-brand-soft">Run check-in</span> above to
              generate this week&apos;s update.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
