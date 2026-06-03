// Small shared presentational primitives used across pages.
import Link from "next/link";
import {
  HEALTH_META,
  STATUS_LABEL,
  type Health,
  type LifecycleStatus,
} from "@/lib/types";

export function HealthBadge({ health }: { health: Health }) {
  const m = HEALTH_META[health];
  return (
    <span className={`chip ${m.bg} ${m.text} ${m.border} border`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function StatusChip({ status }: { status: string }) {
  const label = STATUS_LABEL[status as LifecycleStatus] ?? status;
  return (
    <span className="chip bg-surface-overlay text-slate-400">{label}</span>
  );
}

export function TeamChip({
  team,
  href,
}: {
  team: { name: string; slug: string; color: string };
  href?: string;
}) {
  const inner = (
    <span
      className="chip border"
      style={{
        color: team.color,
        borderColor: `${team.color}55`,
        backgroundColor: `${team.color}1a`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: team.color }}
      />
      {team.name}
    </span>
  );
  return href ? (
    <Link href={href} className="hover:opacity-80">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function ProgressBar({
  pct,
  color = "#6366f1",
  className = "",
}: {
  pct: number;
  color?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-surface-overlay ${className}`}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "warn" | "bad" | "good";
}) {
  const toneText =
    tone === "bad"
      ? "text-rose-300"
      : tone === "warn"
        ? "text-amber-300"
        : tone === "good"
          ? "text-emerald-300"
          : "text-white";
  return (
    <div className="card p-4">
      <div className="label">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneText}`}>{value}</div>
      {sub != null && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Trend({ trend }: { trend: "up" | "down" | "flat" }) {
  const map = {
    up: { icon: "▲", cls: "text-emerald-400" },
    down: { icon: "▼", cls: "text-rose-400" },
    flat: { icon: "▬", cls: "text-slate-500" },
  } as const;
  return <span className={map[trend].cls}>{map[trend].icon}</span>;
}

// Human-readable tracking id, e.g. PRJ-1 / INIT-2 / TASK-9.
export function KeyTag({
  id,
  className = "",
}: {
  id: string | null | undefined;
  className?: string;
}) {
  if (!id) return null;
  return (
    <span
      className={`rounded bg-surface-overlay px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide text-slate-500 ${className}`}
    >
      {id}
    </span>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="card flex items-center justify-center p-10 text-sm text-slate-500">
      {children}
    </div>
  );
}
