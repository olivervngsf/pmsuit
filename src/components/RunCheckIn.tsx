"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckInCard, type CheckInLike } from "./CheckInCard";

type Draft = {
  summary: string;
  highlights: string[];
  risks: string[];
  nextSteps: string[];
  healthAssessment: string;
  source: string;
};

export function RunCheckIn({
  type,
  id,
  label = "Run weekly check-in",
  compact = false,
}: {
  type: "project" | "initiative";
  id: string;
  label?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkins/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");
      setDraft(data.draft);
      setAiConfigured(data.aiConfigured);
      // Refresh server components so the saved check-in shows in history.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "" : "space-y-3"}>
      <button
        onClick={run}
        disabled={loading}
        className={`btn btn-primary ${compact ? "text-xs" : ""}`}
      >
        {loading ? (
          <>
            <Spinner /> Generating…
          </>
        ) : (
          <>✦ {label}</>
        )}
      </button>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      {aiConfigured === false && draft && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Generated with the deterministic fallback. Set{" "}
          <code>ANTHROPIC_API_KEY</code> to get richer, AI-written narratives.
        </div>
      )}

      {draft && (
        <CheckInCard
          checkIn={{
            weekOf: new Date(),
            summary: draft.summary,
            highlights: draft.highlights,
            risks: draft.risks,
            nextSteps: draft.nextSteps,
            healthAssessment: draft.healthAssessment,
            source: draft.source,
          } satisfies CheckInLike}
        />
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}
