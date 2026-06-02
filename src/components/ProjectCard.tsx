import Link from "next/link";
import type { ProjectRollup } from "@/lib/queries";
import { HealthBadge, ProgressBar, TeamChip } from "./ui";
import { fmtShortDate, relativeDays } from "@/lib/format";

export function ProjectCard({ project }: { project: ProjectRollup }) {
  const m = project.metrics;
  const drift = project.signal.suggested !== project.health;
  return (
    <Link
      href={`/projects/${project.id}`}
      className="card group block p-4 transition hover:border-brand/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium text-white group-hover:text-brand-soft">
            {project.name}
          </div>
          {project.initiative && (
            <div className="mt-0.5 truncate text-xs text-slate-500">
              ◆ {project.initiative.name}
            </div>
          )}
        </div>
        <HealthBadge health={project.health} />
      </div>

      {project.impact && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-400">
          {project.impact}
        </p>
      )}

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>
            {m.done}/{m.total} tasks
          </span>
          <span>{m.completionPct}%</span>
        </div>
        <ProgressBar
          pct={m.completionPct}
          color={project.team?.color ?? "#6366f1"}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {project.team && <TeamChip team={project.team} />}
        {m.blocked > 0 && (
          <span className="chip bg-rose-500/10 text-rose-300">
            {m.blocked} blocked
          </span>
        )}
        {m.overdue > 0 && (
          <span className="chip bg-amber-500/10 text-amber-300">
            {m.overdue} overdue
          </span>
        )}
        {drift && (
          <span
            className="chip bg-amber-500/10 text-amber-300"
            title={`Signals suggest ${project.signal.suggested.replace("_", " ").toLowerCase()}`}
          >
            ⚠ health drift
          </span>
        )}
      </div>

      {project.nextMilestone && (
        <div className="mt-3 border-t border-line pt-2 text-xs text-slate-500">
          Next: {project.nextMilestone.name} ·{" "}
          <span className="text-slate-400">
            {fmtShortDate(project.nextMilestone.dueDate)} (
            {relativeDays(project.nextMilestone.dueDate)})
          </span>
        </div>
      )}
    </Link>
  );
}
