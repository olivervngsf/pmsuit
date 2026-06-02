// Builds a grounded CheckInContext from the database, generates a check-in
// (AI or fallback), and persists it. Shared by the API routes and the weekly run.

import { prisma } from "./db";
import { generateCheckIn, type CheckInContext, type CheckInDraft } from "./ai";
import { getProject, getInitiative } from "./queries";
import { startOfWeek } from "./insights";
import { fmtMetric } from "./format";

function bulletsToText(arr: string[]): string {
  return arr.join("\n");
}

async function persist(
  draft: CheckInDraft,
  target: { projectId?: string; initiativeId?: string },
  metrics: unknown,
) {
  return prisma.checkIn.create({
    data: {
      ...target,
      weekOf: startOfWeek(new Date()),
      summary: draft.summary,
      highlights: bulletsToText(draft.highlights),
      risks: bulletsToText(draft.risks),
      nextSteps: bulletsToText(draft.nextSteps),
      healthAssessment: draft.healthAssessment,
      source: draft.source,
      metricsJson: JSON.stringify(metrics),
    },
  });
}

export async function runProjectCheckIn(projectId: string) {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");
  const company = await prisma.company.findFirst();

  const recentlyCompleted = project.tasks
    .filter((t) => t.status === "DONE" && t.completedAt)
    .sort(
      (a, b) =>
        (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
    )
    .slice(0, 6)
    .map((t) => t.title);
  const blockedItems = project.tasks
    .filter((t) => t.status === "BLOCKED")
    .map((t) => t.title);

  const ctx: CheckInContext = {
    kind: "project",
    name: project.name,
    companyName: company?.name ?? "the company",
    period: company?.period ?? "",
    selfHealth: project.health,
    suggestedHealth: project.signal.suggested,
    signalReasons: project.signal.reasons,
    metrics: {
      totalTasks: project.metrics.total,
      done: project.metrics.done,
      inProgress: project.metrics.inProgress,
      blocked: project.metrics.blocked,
      todo: project.metrics.todo,
      overdue: project.metrics.overdue,
      stale: project.metrics.stale,
      completionPct: project.metrics.completionPct,
      velocityLast7: project.metrics.velocityLast7,
      velocityPrev7: project.metrics.velocityPrev7,
    },
    impact: project.impact,
    alignment: project.initiative?.name ?? null,
    teams: project.team ? [project.team.name] : [],
    recentlyCompleted,
    blockedItems,
  };

  const draft = await generateCheckIn(ctx);
  const saved = await persist(draft, { projectId }, ctx.metrics);
  return { draft, checkIn: saved };
}

export async function runInitiativeCheckIn(initiativeId: string) {
  const init = await getInitiative(initiativeId);
  if (!init) throw new Error("Initiative not found");
  const company = await prisma.company.findFirst();

  const ctx: CheckInContext = {
    kind: "initiative",
    name: init.name,
    companyName: company?.name ?? "the company",
    period: company?.period ?? "",
    selfHealth: init.health,
    suggestedHealth: init.signal.suggested,
    signalReasons: init.signal.reasons,
    metrics: {
      totalTasks: init.taskMetrics.total,
      done: init.taskMetrics.done,
      inProgress: init.taskMetrics.inProgress,
      blocked: init.taskMetrics.blocked,
      todo: init.taskMetrics.todo,
      overdue: init.taskMetrics.overdue,
      stale: init.taskMetrics.stale,
      completionPct: init.taskMetrics.completionPct,
      velocityLast7: init.taskMetrics.velocityLast7,
      velocityPrev7: init.taskMetrics.velocityPrev7,
    },
    alignment: init.rationale,
    teams: init.teams.map((t) => t.name),
    outcomes: init.outcomes.map((o) => ({
      name: o.name,
      progress: o.progress,
      current: fmtMetric(o.current, o.metricType, o.unit),
      target: fmtMetric(o.target, o.metricType, o.unit),
      team: o.team?.name ?? null,
    })),
  };

  const draft = await generateCheckIn(ctx);
  const saved = await persist(draft, { initiativeId }, ctx.metrics);
  return { draft, checkIn: saved };
}
