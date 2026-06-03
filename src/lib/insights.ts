// =============================================================================
// Insights engine — pure, deterministic computations.
// =============================================================================
// Everything here is a pure function over plain data, with no DB or network
// access. The UI renders these directly for "quick insights every week", and
// the AI weekly-run feeds these same numbers to Claude so the narrative is
// always grounded in real metrics (never hallucinated).
// =============================================================================

import type { Health } from "./types";

const DAY = 1000 * 60 * 60 * 24;

export const MS_PER_DAY = DAY;

/** Tasks untouched (no update) for this many days are considered "stale". */
export const STALE_DAYS = 10;

type TaskLike = {
  status: string;
  priority: string;
  effort: number;
  dueDate: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
};

type MilestoneLike = {
  status: string;
  dueDate: Date;
};

type OutcomeLike = {
  metricType: string;
  baseline: number;
  current: number;
  target: number;
  higherIsBetter: boolean;
};

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / DAY);
}

/** Monday 00:00 of the week containing `d` (local time). */
export function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = Sun
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  date.setDate(date.getDate() + diff);
  return date;
}

// ---------------------------------------------------------------------------
// Task-level metrics
// ---------------------------------------------------------------------------

export type TaskMetrics = {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  todo: number;
  overdue: number;
  stale: number;
  /** 0..100 completion by count. */
  completionPct: number;
  /** 0..100 completion weighted by effort points. */
  effortCompletionPct: number;
  /** Effort points completed in the trailing 7 days. */
  velocityLast7: number;
  /** Effort points completed in the 7 days before that (for trend). */
  velocityPrev7: number;
};

export function computeTaskMetrics(tasks: TaskLike[], now = new Date()): TaskMetrics {
  const total = tasks.length;
  let done = 0;
  let inProgress = 0;
  let blocked = 0;
  let todo = 0;
  let overdue = 0;
  let stale = 0;
  let effortTotal = 0;
  let effortDone = 0;
  let velocityLast7 = 0;
  let velocityPrev7 = 0;

  const last7 = new Date(now.getTime() - 7 * DAY);
  const prev7 = new Date(now.getTime() - 14 * DAY);
  const staleCutoff = new Date(now.getTime() - STALE_DAYS * DAY);

  for (const t of tasks) {
    effortTotal += t.effort;
    switch (t.status) {
      case "DONE":
        done++;
        effortDone += t.effort;
        if (t.completedAt) {
          if (t.completedAt >= last7) velocityLast7 += t.effort;
          else if (t.completedAt >= prev7) velocityPrev7 += t.effort;
        }
        break;
      case "IN_PROGRESS":
        inProgress++;
        break;
      case "BLOCKED":
        blocked++;
        break;
      default:
        todo++;
    }

    if (t.status !== "DONE") {
      if (t.dueDate && t.dueDate < now) overdue++;
      if (t.updatedAt < staleCutoff) stale++;
    }
  }

  return {
    total,
    done,
    inProgress,
    blocked,
    todo,
    overdue,
    stale,
    completionPct: total === 0 ? 0 : Math.round((done / total) * 100),
    effortCompletionPct:
      effortTotal === 0 ? 0 : Math.round((effortDone / effortTotal) * 100),
    velocityLast7,
    velocityPrev7,
  };
}

// ---------------------------------------------------------------------------
// Outcome / metric progress
// ---------------------------------------------------------------------------

/**
 * Progress of a measurable outcome on a 0..100 scale, accounting for the
 * baseline and for "lower is better" metrics (latency, churn, cost…).
 */
export function outcomeProgress(o: OutcomeLike): number {
  if (o.metricType === "BOOLEAN") {
    return o.current >= o.target ? 100 : 0;
  }
  const span = o.target - o.baseline;
  if (span === 0) {
    // No movement expected; treat hitting target as complete.
    return o.higherIsBetter
      ? o.current >= o.target
        ? 100
        : 0
      : o.current <= o.target
        ? 100
        : 0;
  }
  const moved = o.current - o.baseline;
  const pct = (moved / span) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function avgOutcomeProgress(outcomes: OutcomeLike[]): number {
  if (outcomes.length === 0) return 0;
  const sum = outcomes.reduce((acc, o) => acc + outcomeProgress(o), 0);
  return Math.round(sum / outcomes.length);
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export function nextMilestone(
  milestones: MilestoneLike[],
  now = new Date(),
): MilestoneLike | null {
  const upcoming = milestones
    .filter((m) => m.status === "UPCOMING" && m.dueDate >= now)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  return upcoming[0] ?? null;
}

export function missedMilestones(
  milestones: MilestoneLike[],
  now = new Date(),
): number {
  return milestones.filter(
    (m) => m.status === "MISSED" || (m.status === "UPCOMING" && m.dueDate < now),
  ).length;
}

// ---------------------------------------------------------------------------
// Health suggestion
// ---------------------------------------------------------------------------

export type HealthSignal = {
  suggested: Health;
  reasons: string[];
};

/**
 * Independently *suggest* a health status from the data, so the dashboard can
 * flag when a PM's self-reported health drifts from reality. Conservative by
 * design: a single red signal can move it, two yellows compound.
 */
export function suggestHealth(input: {
  tasks: TaskMetrics;
  outcomesProgress: number | null;
  missedMilestones: number;
  nextMilestoneInDays: number | null;
  targetInDays: number | null;
}): HealthSignal {
  const reasons: string[] = [];
  let score = 0; // higher = worse

  if (input.tasks.total > 0) {
    const blockedRatio = input.tasks.blocked / input.tasks.total;
    if (blockedRatio >= 0.2) {
      score += 2;
      reasons.push(
        `${input.tasks.blocked} of ${input.tasks.total} tasks are blocked`,
      );
    } else if (input.tasks.blocked > 0) {
      score += 1;
      reasons.push(`${input.tasks.blocked} blocked task(s)`);
    }
  }

  if (input.tasks.overdue > 0) {
    score += input.tasks.overdue >= 3 ? 2 : 1;
    reasons.push(`${input.tasks.overdue} overdue task(s)`);
  }

  if (input.tasks.stale >= 3) {
    score += 1;
    reasons.push(`${input.tasks.stale} tasks haven't moved in ${STALE_DAYS}+ days`);
  }

  if (input.missedMilestones > 0) {
    score += 2;
    reasons.push(`${input.missedMilestones} milestone(s) slipped`);
  }

  // Velocity dropping while work remains.
  if (
    input.tasks.velocityLast7 === 0 &&
    input.tasks.velocityPrev7 > 0 &&
    input.tasks.todo + input.tasks.inProgress > 0
  ) {
    score += 1;
    reasons.push("No work completed in the last 7 days");
  }

  // Outcomes well behind where time elapsed would suggest.
  if (input.outcomesProgress !== null && input.outcomesProgress < 25) {
    score += 1;
    reasons.push(`Outcome progress at ${input.outcomesProgress}%`);
  }

  let suggested: Health = "ON_TRACK";
  if (score >= 3) suggested = "OFF_TRACK";
  else if (score >= 1) suggested = "AT_RISK";

  if (reasons.length === 0) reasons.push("No blockers, overdue work, or slips");

  return { suggested, reasons };
}

export function velocityTrend(
  m: TaskMetrics,
): "up" | "down" | "flat" {
  if (m.velocityLast7 > m.velocityPrev7) return "up";
  if (m.velocityLast7 < m.velocityPrev7) return "down";
  return "flat";
}

// --- Time-windowed "projects worked on" counts (week / month / year) --------

type DatedProject = {
  startDate: Date;
  targetDate: Date | null;
  status: string;
};

function weekBounds(now: Date): [Date, Date] {
  const start = startOfWeek(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return [start, end];
}
function monthBounds(now: Date): [Date, Date] {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return [start, end];
}
function yearBounds(now: Date): [Date, Date] {
  return [
    new Date(now.getFullYear(), 0, 1),
    new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
  ];
}

/**
 * How many projects a team is working on within the current week, month, and
 * year. A project counts if its [start, target] span overlaps the period and it
 * isn't archived.
 */
export function activeProjectCounts(
  projects: DatedProject[],
  now = new Date(),
): { week: number; month: number; year: number } {
  const overlaps = (p: DatedProject, [s, e]: [Date, Date]) => {
    const start = p.startDate;
    const end = p.targetDate ?? p.startDate;
    return start <= e && end >= s;
  };
  const count = (b: [Date, Date]) =>
    projects.filter((p) => p.status !== "ARCHIVED" && overlaps(p, b)).length;
  return {
    week: count(weekBounds(now)),
    month: count(monthBounds(now)),
    year: count(yearBounds(now)),
  };
}

export type ScheduleStatus = {
  /** 0..100 of the start→target window that has elapsed. */
  elapsedPct: number;
  /** Work done is meaningfully behind time elapsed. */
  behind: boolean;
  label: "On schedule" | "Behind schedule" | "Past deadline";
};

/**
 * Compares time spent against work completed so the UI can show whether a
 * commitment is on track for its deadline. "Behind" if completion trails the
 * elapsed share of the timeline by more than 10 points.
 */
export function scheduleStatus(
  start: Date,
  target: Date | null,
  completionPct: number,
  now = new Date(),
): ScheduleStatus | null {
  if (!target) return null;
  const span = target.getTime() - start.getTime();
  if (span <= 0) return null;
  const elapsedPct = Math.max(
    0,
    Math.min(100, Math.round(((now.getTime() - start.getTime()) / span) * 100)),
  );
  const pastDeadline = now > target && completionPct < 100;
  const behind = completionPct < elapsedPct - 10;
  const label: ScheduleStatus["label"] = pastDeadline
    ? "Past deadline"
    : behind
      ? "Behind schedule"
      : "On schedule";
  return { elapsedPct, behind: behind || pastDeadline, label };
}
