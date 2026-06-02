import type { OutcomeView } from "@/lib/queries";
import { ProgressBar, TeamChip } from "./ui";
import { fmtMetric } from "@/lib/format";

// The shared "what success looks like" row — readable by any team without
// needing access to the underlying tasks.
export function OutcomeRow({ outcome }: { outcome: OutcomeView }) {
  const color =
    outcome.progress >= 70
      ? "#34d399"
      : outcome.progress >= 35
        ? "#fbbf24"
        : "#fb7185";
  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <span className="font-medium text-slate-200">{outcome.name}</span>
          {outcome.team && (
            <span className="ml-2 align-middle">
              <TeamChip team={outcome.team} href={`/teams/${outcome.team.slug}`} />
            </span>
          )}
        </div>
        <div className="shrink-0 text-right text-sm">
          <span className="font-semibold text-white">
            {fmtMetric(outcome.current, outcome.metricType, outcome.unit)}
          </span>
          <span className="text-slate-500">
            {" "}
            / {fmtMetric(outcome.target, outcome.metricType, outcome.unit)}
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <ProgressBar pct={outcome.progress} color={color} className="flex-1" />
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-400">
          {outcome.progress}%
        </span>
      </div>
      {outcome.higherIsBetter === false && (
        <div className="mt-1 text-[11px] text-slate-600">lower is better</div>
      )}
    </div>
  );
}
