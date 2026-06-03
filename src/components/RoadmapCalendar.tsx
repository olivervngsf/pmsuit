"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LocalProject } from "./ProjectsManager";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const QUARTERS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
];

// A project is "in" a month if its [start, target] span overlaps that month.
function inMonth(p: LocalProject, year: number, month: number): boolean {
  const start = new Date(p.startDate);
  const end = p.targetDate ? new Date(p.targetDate) : start;
  const mStart = new Date(year, month, 1);
  const mEnd = new Date(year, month + 1, 0, 23, 59, 59);
  return start <= mEnd && end >= mStart;
}

function isLocal(id: string) {
  return id.startsWith("proj_") || id.startsWith("loc");
}

export function RoadmapCalendar({
  projects,
  year,
  onYearChange,
  onEdit,
}: {
  projects: LocalProject[];
  year: number;
  onYearChange: (y: number) => void;
  onEdit: (p: LocalProject) => void;
}) {
  const now = new Date();
  const scheduled = projects.filter((p) => p.targetDate || p.startDate);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onYearChange(year - 1)}
            className="rounded-md border border-line p-1.5 text-slate-400 hover:text-white"
            aria-label="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[4rem] text-center text-sm font-semibold text-white">
            {year}
          </span>
          <button
            onClick={() => onYearChange(year + 1)}
            className="rounded-md border border-line p-1.5 text-slate-400 hover:text-white"
            aria-label="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <span className="text-xs text-slate-500">
          {scheduled.length} scheduled · placed by start → target date
        </span>
      </div>

      <div className="space-y-3">
        {QUARTERS.map((months, qi) => (
          <div key={qi} className="flex gap-3">
            <div className="w-7 shrink-0 pt-3 text-xs font-medium text-slate-600">
              Q{qi + 1}
            </div>
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
              {months.map((m) => {
                const items = projects.filter((p) => inMonth(p, year, m));
                const current =
                  now.getFullYear() === year && now.getMonth() === m;
                return (
                  <div
                    key={m}
                    className={`card min-h-[116px] p-3 ${
                      current ? "border-brand/40" : ""
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">
                        {MONTHS[m]}
                      </span>
                      {current && (
                        <span className="text-[10px] text-brand-soft">now</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {items.map((p) => {
                        const color = p.teamColor ?? "#6366f1";
                        const inner = (
                          <span className="flex items-center gap-1.5 truncate">
                            {p.key && (
                              <span className="font-mono text-[9px] text-slate-500">
                                {p.key}
                              </span>
                            )}
                            <span className="truncate">{p.name}</span>
                          </span>
                        );
                        const cls =
                          "block w-full truncate rounded border-l-2 bg-surface-overlay/50 px-2 py-1 text-left text-xs text-slate-300 hover:bg-surface-overlay";
                        return isLocal(p.id) ? (
                          <button
                            key={p.id}
                            onClick={() => onEdit(p)}
                            style={{ borderColor: color }}
                            className={cls}
                            title={p.name}
                          >
                            {inner}
                          </button>
                        ) : (
                          <Link
                            key={p.id}
                            href={`/projects/${p.id}`}
                            style={{ borderColor: color }}
                            className={cls}
                            title={p.name}
                          >
                            {inner}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
