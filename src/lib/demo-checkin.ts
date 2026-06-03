// Client-safe sample check-in used in the static demo build.
// In a full dynamic deployment, the "Run check-in" buttons call the API
// (Claude or the deterministic fallback). In the static export there is no
// server, so the buttons fall back to this representative sample instead —
// keeping the interaction looking alive without any backend.

export type DemoDraft = {
  summary: string;
  highlights: string[];
  risks: string[];
  nextSteps: string[];
  healthAssessment: "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
  source: "FALLBACK";
};

export function sampleCheckIn(
  name: string,
  kind: "project" | "initiative" = "initiative",
): DemoDraft {
  const noun = kind === "project" ? "project" : "initiative";
  return {
    summary: `${name} is making steady progress this week, with a few items that need attention to stay on plan.`,
    highlights: [
      "Several key tasks closed out, keeping weekly velocity healthy.",
      kind === "initiative"
        ? "Outcome metrics continued to move toward their targets."
        : "Work is laddering up cleanly to the parent initiative's outcomes.",
    ],
    risks: [
      "A blocked item needs unblocking to avoid slipping the next milestone.",
      "A couple of tasks are approaching their due dates.",
    ],
    nextSteps: [
      "Resolve the open blocker in this week's review.",
      `Drive the in-progress work in ${name} to done.`,
    ],
    healthAssessment: "AT_RISK",
    source: "FALLBACK",
  };
}
