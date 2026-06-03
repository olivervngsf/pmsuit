import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { HealthBadge, KeyTag } from "./ui";
import { OutcomeRow } from "./Outcome";
import type { OutcomeView } from "@/lib/queries";
import type { Health } from "@/lib/types";

export type ProjectAlignmentData = {
  id: string;
  key: string | null;
  name: string;
  rationale: string | null;
  description: string | null;
  health: Health;
  outcomesProgress: number;
  outcomes: OutcomeView[];
} | null;

// Answers "what is this project focused on, and what's the impact?" — the
// parent initiative, why it matters, the project's specific impact, and the
// success metrics it ladders up to.
export function ProjectAlignment({
  alignment,
  impact,
}: {
  alignment: ProjectAlignmentData;
  impact: string | null;
}) {
  if (!alignment) {
    return (
      <div className="card border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-300">
          <AlertTriangle className="h-4 w-4" /> Not aligned to an initiative
        </div>
        <p className="mt-1 text-sm text-slate-400">
          This project isn&apos;t linked to a company initiative, so its strategic
          value is unclear. Link it to an initiative to show what it drives.
        </p>
        {impact && (
          <div className="mt-3">
            <div className="label">Stated impact</div>
            <p className="mt-1 text-sm text-slate-200">{impact}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="label mb-1">Focused on initiative</div>
          <div className="flex flex-wrap items-center gap-2">
            <KeyTag id={alignment.key} />
            <Link
              href={`/initiatives/${alignment.id}`}
              className="font-semibold text-white hover:text-brand-soft"
            >
              {alignment.name}
            </Link>
            <HealthBadge health={alignment.health} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-semibold text-white">
            {alignment.outcomesProgress}%
          </div>
          <div className="label">outcomes</div>
        </div>
      </div>

      {alignment.rationale && (
        <p className="mt-2 text-sm text-slate-400">
          <span className="text-slate-500">Why it matters: </span>
          {alignment.rationale}
        </p>
      )}

      {impact && (
        <div className="mt-3 rounded-lg border border-brand/20 bg-brand/5 p-3">
          <div className="label text-brand-soft">This project&apos;s impact</div>
          <p className="mt-1 text-sm text-slate-200">{impact}</p>
        </div>
      )}

      {alignment.outcomes.length > 0 && (
        <div className="mt-3">
          <div className="label mb-1">Success metrics it contributes to</div>
          <div className="divide-y divide-line">
            {alignment.outcomes.map((o) => (
              <OutcomeRow key={o.id} outcome={o} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
