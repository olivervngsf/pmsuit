import { HealthBadge } from "./ui";
import { fmtDate } from "@/lib/format";
import type { Health } from "@/lib/types";

export type CheckInLike = {
  weekOf: Date | string;
  summary: string;
  highlights?: string[] | string | null;
  risks?: string[] | string | null;
  nextSteps?: string[] | string | null;
  healthAssessment: string;
  source: string;
};

function toLines(v: string[] | string | null | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return v.split("\n").map((l) => l.trim()).filter(Boolean);
}

const SOURCE_LABEL: Record<string, string> = {
  AI: "AI-generated",
  FALLBACK: "Auto (no API key)",
  MANUAL: "Manual",
};

function BulletGroup({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "bad" | "next";
}) {
  if (items.length === 0) return null;
  const dot =
    tone === "good"
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-rose-400"
        : "text-brand-soft";
  return (
    <div>
      <div className="label mb-1">{title}</div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-300">
            <span className={`${dot} mt-0.5`}>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CheckInCard({ checkIn }: { checkIn: CheckInLike }) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Week of {fmtDate(checkIn.weekOf)} ·{" "}
          <span className="text-slate-400">
            {SOURCE_LABEL[checkIn.source] ?? checkIn.source}
          </span>
        </div>
        <HealthBadge health={checkIn.healthAssessment as Health} />
      </div>
      <p className="text-sm text-slate-200">{checkIn.summary}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <BulletGroup title="Highlights" items={toLines(checkIn.highlights)} tone="good" />
        <BulletGroup title="Risks" items={toLines(checkIn.risks)} tone="bad" />
        <BulletGroup title="Next steps" items={toLines(checkIn.nextSteps)} tone="next" />
      </div>
    </div>
  );
}
