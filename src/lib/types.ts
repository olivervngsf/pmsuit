// Shared enums and labels. Kept as string unions (matching the SQLite schema,
// which stores them as plain strings) plus presentation metadata used across
// the UI so colors/labels stay consistent everywhere.

export type Health = "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
export type LifecycleStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "ARCHIVED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type MetricType = "NUMBER" | "PERCENT" | "CURRENCY" | "BOOLEAN";
export type CheckInSource = "AI" | "MANUAL" | "FALLBACK";

export const HEALTH_META: Record<
  Health,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  ON_TRACK: {
    label: "On track",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  AT_RISK: {
    label: "At risk",
    dot: "bg-amber-400",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  OFF_TRACK: {
    label: "Off track",
    dot: "bg-rose-400",
    text: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
};

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; text: string; bg: string }
> = {
  TODO: { label: "To do", text: "text-slate-300", bg: "bg-slate-500/10" },
  IN_PROGRESS: {
    label: "In progress",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
  },
  BLOCKED: { label: "Blocked", text: "text-rose-300", bg: "bg-rose-500/10" },
  DONE: { label: "Done", text: "text-emerald-300", bg: "bg-emerald-500/10" },
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
];

export const PRIORITY_META: Record<
  Priority,
  { label: string; text: string; bg: string; rank: number }
> = {
  URGENT: { label: "Urgent", text: "text-rose-300", bg: "bg-rose-500/15", rank: 3 },
  HIGH: { label: "High", text: "text-amber-300", bg: "bg-amber-500/15", rank: 2 },
  MEDIUM: { label: "Medium", text: "text-sky-300", bg: "bg-sky-500/15", rank: 1 },
  LOW: { label: "Low", text: "text-slate-300", bg: "bg-slate-500/15", rank: 0 },
};

export const STATUS_LABEL: Record<LifecycleStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};
