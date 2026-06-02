// =============================================================================
// AI weekly check-in layer
// =============================================================================
// Generates a weekly status check-in for a project or an initiative. The metrics
// are computed deterministically (insights.ts) and passed to Claude so the
// narrative is grounded in real numbers. If no ANTHROPIC_API_KEY is set, a
// deterministic rule-based summary is produced instead, so the whole product
// works end-to-end with or without a key.
// =============================================================================

import Anthropic from "@anthropic-ai/sdk";
import type { Health } from "./types";
import { velocityTrend } from "./insights";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export type CheckInDraft = {
  summary: string;
  highlights: string[];
  risks: string[];
  nextSteps: string[];
  healthAssessment: Health;
  source: "AI" | "FALLBACK";
};

// The grounded fact sheet handed to the model (or the fallback writer).
export type CheckInContext = {
  kind: "project" | "initiative";
  name: string;
  companyName: string;
  period: string;
  selfHealth: Health;
  suggestedHealth: Health;
  signalReasons: string[];
  metrics: {
    totalTasks: number;
    done: number;
    inProgress: number;
    blocked: number;
    todo: number;
    overdue: number;
    stale: number;
    completionPct: number;
    velocityLast7: number;
    velocityPrev7: number;
  };
  outcomes?: {
    name: string;
    progress: number;
    current: string;
    target: string;
    team: string | null;
  }[];
  impact?: string | null;
  alignment?: string | null; // initiative name / rationale a project ladders to
  teams?: string[];
  recentlyCompleted?: string[];
  blockedItems?: string[];
};

export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function worstHealth(a: Health, b: Health): Health {
  const rank: Record<Health, number> = {
    ON_TRACK: 0,
    AT_RISK: 1,
    OFF_TRACK: 2,
  };
  return rank[a] >= rank[b] ? a : b;
}

const SYSTEM_PROMPT = `You are the weekly check-in writer inside a project management suite used by PMs across an entire company.

Your job: turn a grounded fact sheet of metrics into a crisp, honest weekly status update that an executive or a peer team can read in 30 seconds.

Rules:
- Be concrete and specific. Reference the actual numbers provided. Never invent facts, names, dates, or metrics that are not in the fact sheet.
- Lead with outcomes and impact, not activity. For initiatives, focus on whether success metrics are moving. For projects, focus on the impact toward the parent initiative.
- Be candid about risk. If the data shows blocked work, overdue items, slipping velocity, or stalled progress, say so plainly.
- Keep it tight: a 1-2 sentence summary, then 2-4 bullets each for highlights, risks, and next steps. Fewer is fine if the data is thin.
- Highlights = real wins this period. Risks = what could cause a miss. Next steps = the most leveraged actions.
- Write for cross-functional readers who do NOT see individual tasks. Translate execution detail into outcome language.

Return ONLY valid JSON, no markdown fences, matching exactly:
{"summary": string, "highlights": string[], "risks": string[], "nextSteps": string[], "healthAssessment": "ON_TRACK" | "AT_RISK" | "OFF_TRACK"}`;

function buildUserPrompt(ctx: CheckInContext): string {
  const lines: string[] = [];
  lines.push(`Company: ${ctx.companyName} — Period: ${ctx.period}`);
  lines.push(`${ctx.kind === "project" ? "Project" : "Initiative"}: ${ctx.name}`);
  if (ctx.alignment) lines.push(`Aligned to initiative: ${ctx.alignment}`);
  if (ctx.impact) lines.push(`Intended impact: ${ctx.impact}`);
  if (ctx.teams?.length) lines.push(`Contributing teams: ${ctx.teams.join(", ")}`);
  lines.push("");
  lines.push(`PM self-reported health: ${ctx.selfHealth}`);
  lines.push(
    `System-suggested health: ${ctx.suggestedHealth} (${ctx.signalReasons.join("; ")})`,
  );
  lines.push("");
  lines.push("Execution metrics:");
  const m = ctx.metrics;
  lines.push(
    `- Tasks: ${m.totalTasks} total | ${m.done} done, ${m.inProgress} in progress, ${m.blocked} blocked, ${m.todo} to do`,
  );
  lines.push(`- Completion: ${m.completionPct}%`);
  lines.push(`- Overdue: ${m.overdue} | Stale (no movement 10d+): ${m.stale}`);
  lines.push(
    `- Velocity (effort pts done): last 7d = ${m.velocityLast7}, prior 7d = ${m.velocityPrev7}`,
  );
  if (ctx.outcomes?.length) {
    lines.push("");
    lines.push("Success metrics / outcomes:");
    for (const o of ctx.outcomes) {
      lines.push(
        `- ${o.name}${o.team ? ` [${o.team}]` : ""}: ${o.current} → target ${o.target} (${o.progress}% there)`,
      );
    }
  }
  if (ctx.recentlyCompleted?.length) {
    lines.push("");
    lines.push("Recently completed work:");
    for (const r of ctx.recentlyCompleted.slice(0, 8)) lines.push(`- ${r}`);
  }
  if (ctx.blockedItems?.length) {
    lines.push("");
    lines.push("Currently blocked:");
    for (const b of ctx.blockedItems.slice(0, 8)) lines.push(`- ${b}`);
  }
  lines.push("");
  lines.push("Write the weekly check-in as specified.");
  return lines.join("\n");
}

/** Deterministic fallback used when no API key is configured (or on error). */
export function fallbackCheckIn(ctx: CheckInContext): CheckInDraft {
  const m = ctx.metrics;
  const trend = velocityTrend({
    velocityLast7: m.velocityLast7,
    velocityPrev7: m.velocityPrev7,
  } as any);

  const highlights: string[] = [];
  if (m.done > 0)
    highlights.push(
      `${m.done} of ${m.totalTasks} tasks complete (${m.completionPct}%).`,
    );
  if (m.velocityLast7 > 0)
    highlights.push(
      `${m.velocityLast7} effort points delivered in the last 7 days${
        trend === "up" ? " — up from the prior week" : ""
      }.`,
    );
  for (const o of ctx.outcomes ?? []) {
    if (o.progress >= 50)
      highlights.push(`${o.name} at ${o.progress}% of target (${o.current}).`);
  }
  if (highlights.length === 0)
    highlights.push("Work is underway; no completed items to report yet.");

  const risks: string[] = [];
  if (m.blocked > 0) risks.push(`${m.blocked} task(s) blocked and need unblocking.`);
  if (m.overdue > 0) risks.push(`${m.overdue} task(s) are past due.`);
  if (m.stale > 0)
    risks.push(`${m.stale} task(s) haven't moved in 10+ days — may be stalled.`);
  if (m.velocityLast7 === 0 && m.todo + m.inProgress > 0)
    risks.push("No work completed in the last 7 days while items remain open.");
  for (const o of ctx.outcomes ?? []) {
    if (o.progress < 25) risks.push(`${o.name} is only ${o.progress}% toward target.`);
  }
  if (risks.length === 0) risks.push("No material risks detected in the data.");

  const nextSteps: string[] = [];
  if (m.blocked > 0) nextSteps.push("Resolve blockers in this week's check-in.");
  if (m.overdue > 0) nextSteps.push("Re-baseline or close overdue items.");
  if (m.inProgress > 0)
    nextSteps.push(`Drive the ${m.inProgress} in-progress item(s) to done.`);
  if (nextSteps.length === 0)
    nextSteps.push("Pick up the next highest-priority items from the backlog.");

  const health = worstHealth(ctx.selfHealth, ctx.suggestedHealth);
  const summary =
    `${ctx.name} is ${health.replace("_", " ").toLowerCase()} at ${m.completionPct}% complete` +
    `${m.blocked + m.overdue > 0 ? ` with ${m.blocked + m.overdue} item(s) needing attention` : ""}.`;

  return {
    summary,
    highlights: highlights.slice(0, 4),
    risks: risks.slice(0, 4),
    nextSteps: nextSteps.slice(0, 4),
    healthAssessment: health,
    source: "FALLBACK",
  };
}

/** Generate a check-in via Claude, falling back to the rule-based writer. */
export async function generateCheckIn(ctx: CheckInContext): Promise<CheckInDraft> {
  if (!isAIConfigured()) {
    return fallbackCheckIn(ctx);
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          // Cache the static system prompt across the many check-ins generated
          // in a single weekly run — large cost/latency win at scale.
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: buildUserPrompt(ctx) }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const parsed = parseDraft(text);
    if (parsed) return { ...parsed, source: "AI" };
    // Model returned something unparseable — fall back rather than fail.
    return fallbackCheckIn(ctx);
  } catch (err) {
    console.error("[ai] check-in generation failed, using fallback:", err);
    return fallbackCheckIn(ctx);
  }
}

function parseDraft(text: string): Omit<CheckInDraft, "source"> | null {
  // Tolerate stray markdown fences just in case.
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    const health: Health = ["ON_TRACK", "AT_RISK", "OFF_TRACK"].includes(
      obj.healthAssessment,
    )
      ? obj.healthAssessment
      : "ON_TRACK";
    return {
      summary: String(obj.summary ?? "").trim(),
      highlights: toStringArray(obj.highlights),
      risks: toStringArray(obj.risks),
      nextSteps: toStringArray(obj.nextSteps),
      healthAssessment: health,
    };
  } catch {
    return null;
  }
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean).slice(0, 6);
}
