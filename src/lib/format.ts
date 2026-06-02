// Small presentation helpers shared across server and client components.

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtShortDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function relativeDays(d: Date | string | null | undefined): string {
  if (!d) return "no date";
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Math.round(
    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 0) return `in ${diff}d`;
  return `${Math.abs(diff)}d ago`;
}

/** Format a metric value with its unit / type. */
export function fmtMetric(
  value: number,
  metricType: string,
  unit?: string | null,
): string {
  switch (metricType) {
    case "CURRENCY":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: value % 1 === 0 ? 0 : 2,
      }).format(value);
    case "PERCENT":
      return `${round(value)}%`;
    case "BOOLEAN":
      return value >= 1 ? "Yes" : "No";
    default: {
      const n = new Intl.NumberFormat("en-US").format(round(value));
      return unit ? `${n} ${unit}` : n;
    }
  }
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Split a newline-separated bullet string into trimmed, non-empty lines. */
export function bullets(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
