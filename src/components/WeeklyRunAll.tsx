"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckInCard } from "./CheckInCard";

type Target = { type: "initiative" | "project"; id: string; name: string };

type Result = {
  name: string;
  draft: {
    summary: string;
    highlights: string[];
    risks: string[];
    nextSteps: string[];
    healthAssessment: string;
    source: string;
  };
};

export function WeeklyRunAll({
  targets,
  aiConfigured,
}: {
  targets: Target[];
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function runAll() {
    setRunning(true);
    setResults([]);
    setDone(0);
    setError(null);
    const collected: Result[] = [];
    try {
      for (const t of targets) {
        const res = await fetch("/api/checkins/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: t.type, id: t.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Failed on ${t.name}`);
        collected.push({ name: t.name, draft: data.draft });
        setResults([...collected]);
        setDone((d) => d + 1);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={runAll} disabled={running} className="btn btn-primary">
          {running ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Running {done}/{targets.length}…
            </>
          ) : (
            <>✦ Run weekly check-in across all {targets.length} initiatives</>
          )}
        </button>
        <span
          className={`chip border ${
            aiConfigured
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
          }`}
        >
          {aiConfigured ? "Claude API connected" : "Fallback mode (no API key)"}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i}>
              <div className="mb-1 text-sm font-medium text-slate-300">
                ◆ {r.name}
              </div>
              <CheckInCard
                checkIn={{
                  weekOf: new Date(),
                  summary: r.draft.summary,
                  highlights: r.draft.highlights,
                  risks: r.draft.risks,
                  nextSteps: r.draft.nextSteps,
                  healthAssessment: r.draft.healthAssessment,
                  source: r.draft.source,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
