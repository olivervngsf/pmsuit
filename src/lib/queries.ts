// =============================================================================
// Data-access layer — the ONE seam to re-point at real data.
// =============================================================================
// Every page and API route reads through these functions instead of touching
// Prisma directly. To swap the demo SQLite data for a real source (Jira,
// Linear, a warehouse, an internal API), reimplement these functions to return
// the same shapes and the entire UI keeps working unchanged.
// =============================================================================

import { prisma } from "./db";
import {
  avgOutcomeProgress,
  computeTaskMetrics,
  missedMilestones,
  nextMilestone,
  outcomeProgress,
  suggestHealth,
  daysBetween,
  type TaskMetrics,
  type HealthSignal,
} from "./insights";
import type { Health } from "./types";

// ---- Composite view types the UI consumes ---------------------------------

export type ProjectRollup = {
  id: string;
  key: string | null;
  name: string;
  description: string | null;
  impact: string | null;
  status: string;
  health: Health;
  lead: string | null;
  startDate: Date;
  targetDate: Date | null;
  team: { id: string; name: string; slug: string; color: string } | null;
  initiative: { id: string; name: string } | null;
  metrics: TaskMetrics;
  signal: HealthSignal;
  nextMilestone: { name: string; dueDate: Date } | null;
  taskCount: number;
};

export type OutcomeView = {
  id: string;
  name: string;
  description: string | null;
  metricType: string;
  unit: string | null;
  baseline: number;
  current: number;
  target: number;
  higherIsBetter: boolean;
  progress: number;
  team: { id: string; name: string; slug: string; color: string } | null;
};

export type InitiativeRollup = {
  id: string;
  key: string | null;
  name: string;
  description: string | null;
  rationale: string | null;
  status: string;
  health: Health;
  owner: string | null;
  order: number;
  startDate: Date;
  targetDate: Date | null;
  outcomes: OutcomeView[];
  outcomesProgress: number;
  projects: ProjectRollup[];
  teams: { id: string; name: string; slug: string; color: string }[];
  signal: HealthSignal;
  taskMetrics: TaskMetrics;
};

// ---- Helpers ---------------------------------------------------------------

function toProjectRollup(p: any, now: Date): ProjectRollup {
  const metrics = computeTaskMetrics(p.tasks ?? [], now);
  const next = nextMilestone(p.milestones ?? [], now);
  const missed = missedMilestones(p.milestones ?? [], now);
  const signal = suggestHealth({
    tasks: metrics,
    outcomesProgress: null,
    missedMilestones: missed,
    nextMilestoneInDays: next ? daysBetween(next.dueDate, now) : null,
    targetInDays: p.targetDate ? daysBetween(p.targetDate, now) : null,
  });
  return {
    id: p.id,
    key: p.key ?? null,
    name: p.name,
    description: p.description,
    impact: p.impact,
    status: p.status,
    health: p.health as Health,
    lead: p.lead,
    startDate: p.startDate,
    targetDate: p.targetDate,
    team: p.team
      ? { id: p.team.id, name: p.team.name, slug: p.team.slug, color: p.team.color }
      : null,
    initiative: p.initiative
      ? { id: p.initiative.id, name: p.initiative.name }
      : null,
    metrics,
    signal,
    nextMilestone: next ? { name: (next as any).name, dueDate: next.dueDate } : null,
    taskCount: (p.tasks ?? []).length,
  };
}

function toOutcomeView(o: any): OutcomeView {
  return {
    id: o.id,
    name: o.name,
    description: o.description,
    metricType: o.metricType,
    unit: o.unit,
    baseline: o.baseline,
    current: o.current,
    target: o.target,
    higherIsBetter: o.higherIsBetter,
    progress: outcomeProgress(o),
    team: o.team
      ? { id: o.team.id, name: o.team.name, slug: o.team.slug, color: o.team.color }
      : null,
  };
}

const projectInclude = {
  team: true,
  initiative: { select: { id: true, name: true } },
  tasks: true,
  milestones: true,
} as const;

// ---- Public queries --------------------------------------------------------

export async function getCompany() {
  return prisma.company.findFirst();
}

export async function getInitiatives(now = new Date()): Promise<InitiativeRollup[]> {
  const initiatives = await prisma.initiative.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      outcomes: { include: { team: true }, orderBy: { createdAt: "asc" } },
      projects: { include: projectInclude },
    },
  });

  return initiatives.map((init) => toInitiativeRollup(init, now));
}

export async function getInitiative(
  id: string,
  now = new Date(),
): Promise<InitiativeRollup | null> {
  const init = await prisma.initiative.findUnique({
    where: { id },
    include: {
      outcomes: { include: { team: true }, orderBy: { createdAt: "asc" } },
      projects: { include: projectInclude },
    },
  });
  if (!init) return null;
  return toInitiativeRollup(init, now);
}

function toInitiativeRollup(init: any, now: Date): InitiativeRollup {
  const outcomes = (init.outcomes ?? []).map(toOutcomeView);
  const outcomesProgress = avgOutcomeProgress(init.outcomes ?? []);
  const projects = (init.projects ?? []).map((p: any) => toProjectRollup(p, now));

  // Aggregate task metrics across all projects for an initiative-level signal.
  const allTasks = (init.projects ?? []).flatMap((p: any) => p.tasks ?? []);
  const taskMetrics = computeTaskMetrics(allTasks, now);
  const allMilestones = (init.projects ?? []).flatMap((p: any) => p.milestones ?? []);
  const signal = suggestHealth({
    tasks: taskMetrics,
    outcomesProgress: outcomes.length ? outcomesProgress : null,
    missedMilestones: missedMilestones(allMilestones, now),
    nextMilestoneInDays: null,
    targetInDays: init.targetDate ? daysBetween(init.targetDate, now) : null,
  });

  // Unique teams contributing (from owned outcomes + project teams).
  const teamMap = new Map<string, any>();
  for (const o of init.outcomes ?? []) {
    if (o.team) teamMap.set(o.team.id, o.team);
  }
  for (const p of init.projects ?? []) {
    if (p.team) teamMap.set(p.team.id, p.team);
  }
  const teams = [...teamMap.values()].map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    color: t.color,
  }));

  return {
    id: init.id,
    key: init.key ?? null,
    name: init.name,
    description: init.description,
    rationale: init.rationale,
    status: init.status,
    health: init.health as Health,
    owner: init.owner,
    order: init.order,
    startDate: init.startDate,
    targetDate: init.targetDate,
    outcomes,
    outcomesProgress,
    projects,
    teams,
    signal,
    taskMetrics,
  };
}

export async function getProjects(now = new Date()): Promise<ProjectRollup[]> {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: projectInclude,
  });
  return projects.map((p) => toProjectRollup(p, now));
}

export async function getProject(id: string, now = new Date()) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      ...projectInclude,
      // Richer initiative (overrides projectInclude's id/name-only select) so we
      // can show what this project is contributing toward.
      initiative: {
        include: {
          outcomes: { include: { team: true }, orderBy: { createdAt: "asc" } },
        },
      },
      owner: { include: { team: true } },
      contributors: {
        include: { team: true, pointPerson: true },
      },
      checkIns: { orderBy: { weekOf: "desc" }, take: 8 },
    },
  });
  if (!project) return null;
  const rollup = toProjectRollup(project, now);

  // The alignment story: which initiative this project drives, why it matters,
  // and the success metrics it ladders up to.
  const init = project.initiative as any;
  const alignment = init
    ? {
        id: init.id,
        key: init.key ?? null,
        name: init.name,
        rationale: init.rationale as string | null,
        description: init.description as string | null,
        health: init.health as Health,
        outcomesProgress: avgOutcomeProgress(init.outcomes ?? []),
        outcomes: (init.outcomes ?? []).map(toOutcomeView),
      }
    : null;

  // Order contributors by RACI weight so the accountable owner reads first.
  const RACI_ORDER: Record<string, number> = {
    ACCOUNTABLE: 0,
    RESPONSIBLE: 1,
    CONTRIBUTING: 2,
    CONSULTED: 3,
    INFORMED: 4,
  };
  const contributors = [...project.contributors]
    .sort(
      (a, b) =>
        (RACI_ORDER[a.responsibility] ?? 9) - (RACI_ORDER[b.responsibility] ?? 9),
    )
    .map((c) => ({
      id: c.id,
      responsibility: c.responsibility,
      team: c.team
        ? { id: c.team.id, name: c.team.name, slug: c.team.slug, color: c.team.color }
        : null,
      pointPerson: c.pointPerson
        ? {
            id: c.pointPerson.id,
            name: c.pointPerson.name,
            role: c.pointPerson.role,
            avatar: c.pointPerson.avatar,
          }
        : null,
    }));

  return {
    ...rollup,
    owner: project.owner
      ? {
          id: project.owner.id,
          name: project.owner.name,
          role: project.owner.role,
          avatar: project.owner.avatar,
          team: project.owner.team
            ? {
                id: project.owner.team.id,
                name: project.owner.team.name,
                slug: project.owner.team.slug,
                color: project.owner.team.color,
              }
            : null,
        }
      : null,
    contributors,
    alignment,
    tasks: project.tasks,
    milestones: project.milestones.sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
    ),
    checkIns: project.checkIns,
  };
}

export async function getTeams() {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      members: true,
      _count: { select: { projects: true, outcomes: true } },
    },
  });
  return teams;
}

export async function getTeamBySlug(slug: string, now = new Date()) {
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      members: true,
      outcomes: {
        include: { team: true, initiative: { select: { id: true, name: true } } },
      },
      projects: { include: projectInclude },
    },
  });
  if (!team) return null;
  return {
    ...team,
    projects: team.projects.map((p) => toProjectRollup(p, now)),
    outcomeViews: team.outcomes.map((o) => ({
      ...toOutcomeView(o),
      initiative: (o as any).initiative,
    })),
  };
}

// ---- Portfolio-level summary used by the dashboard + AI --------------------

export type PortfolioSummary = {
  initiativeCount: number;
  projectCount: number;
  atRiskInitiatives: number;
  offTrackInitiatives: number;
  atRiskProjects: number;
  offTrackProjects: number;
  totalOutcomes: number;
  avgOutcomeProgress: number;
  overdueTasks: number;
  blockedTasks: number;
  staleTasks: number;
  velocityLast7: number;
  velocityPrev7: number;
  driftCount: number; // self-reported health more optimistic than the signal
};

const HEALTH_RANK: Record<Health, number> = {
  ON_TRACK: 0,
  AT_RISK: 1,
  OFF_TRACK: 2,
};

export function summarizePortfolio(
  initiatives: InitiativeRollup[],
): PortfolioSummary {
  let projectCount = 0;
  let atRiskInitiatives = 0;
  let offTrackInitiatives = 0;
  let atRiskProjects = 0;
  let offTrackProjects = 0;
  let totalOutcomes = 0;
  let outcomeProgressSum = 0;
  let overdueTasks = 0;
  let blockedTasks = 0;
  let staleTasks = 0;
  let velocityLast7 = 0;
  let velocityPrev7 = 0;
  let driftCount = 0;

  for (const init of initiatives) {
    if (init.health === "AT_RISK") atRiskInitiatives++;
    if (init.health === "OFF_TRACK") offTrackInitiatives++;
    totalOutcomes += init.outcomes.length;
    outcomeProgressSum += init.outcomesProgress * init.outcomes.length;

    for (const p of init.projects) {
      projectCount++;
      if (p.health === "AT_RISK") atRiskProjects++;
      if (p.health === "OFF_TRACK") offTrackProjects++;
      overdueTasks += p.metrics.overdue;
      blockedTasks += p.metrics.blocked;
      staleTasks += p.metrics.stale;
      velocityLast7 += p.metrics.velocityLast7;
      velocityPrev7 += p.metrics.velocityPrev7;
      // Drift: PM says healthier than the computed signal.
      if (HEALTH_RANK[p.signal.suggested] > HEALTH_RANK[p.health]) driftCount++;
    }
  }

  return {
    initiativeCount: initiatives.length,
    projectCount,
    atRiskInitiatives,
    offTrackInitiatives,
    atRiskProjects,
    offTrackProjects,
    totalOutcomes,
    avgOutcomeProgress:
      totalOutcomes === 0 ? 0 : Math.round(outcomeProgressSum / totalOutcomes),
    overdueTasks,
    blockedTasks,
    staleTasks,
    velocityLast7,
    velocityPrev7,
    driftCount,
  };
}
