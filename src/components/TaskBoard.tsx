"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TASK_STATUS_META,
  TASK_STATUS_ORDER,
  PRIORITY_META,
  type TaskStatus,
  type Priority,
} from "@/lib/types";
import { relativeDays } from "@/lib/format";

export type BoardTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: string | null;
  effort: number;
  dueDate: Date | string | null;
};

// Click a task to advance it through the workflow; Shift-click to move it back.
const NEXT: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  BLOCKED: "IN_PROGRESS",
  DONE: "DONE",
};
const PREV: Record<TaskStatus, TaskStatus> = {
  TODO: "TODO",
  IN_PROGRESS: "TODO",
  BLOCKED: "TODO",
  DONE: "IN_PROGRESS",
};

export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  const router = useRouter();
  const [items, setItems] = useState(tasks);
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(id: string, status: TaskStatus) {
    setBusy(id);
    // Optimistic update.
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t)),
    );
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const columns = TASK_STATUS_ORDER.map((status) => ({
    status,
    meta: TASK_STATUS_META[status],
    tasks: items.filter((t) => t.status === status),
  }));

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => (
        <div key={col.status} className="rounded-xl border border-line bg-surface-raised/40 p-2.5">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className={`text-xs font-semibold ${col.meta.text}`}>
              {col.meta.label}
            </span>
            <span className="text-xs text-slate-600">{col.tasks.length}</span>
          </div>
          <div className="space-y-2">
            {col.tasks.map((t) => {
              const pri = PRIORITY_META[t.priority as Priority];
              const overdue =
                t.status !== "DONE" &&
                t.dueDate != null &&
                new Date(t.dueDate) < new Date();
              return (
                <div
                  key={t.id}
                  onClick={(e) =>
                    setStatus(
                      t.id,
                      e.shiftKey
                        ? PREV[t.status as TaskStatus]
                        : NEXT[t.status as TaskStatus],
                    )
                  }
                  className={`cursor-pointer rounded-lg border border-line bg-surface-overlay/60 p-2.5 text-sm transition hover:border-brand/40 ${
                    busy === t.id ? "opacity-50" : ""
                  }`}
                  title="Click to advance · Shift-click to move back"
                >
                  <div className="text-slate-200">{t.title}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className={`chip ${pri.bg} ${pri.text}`}>{pri.label}</span>
                    <span className="text-slate-600">{t.effort} pts</span>
                    {t.assignee && (
                      <span className="text-slate-500">· {t.assignee}</span>
                    )}
                    {t.dueDate && (
                      <span className={overdue ? "text-amber-400" : "text-slate-600"}>
                        · {relativeDays(t.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {col.tasks.length === 0 && (
              <div className="px-1 py-3 text-center text-xs text-slate-700">
                —
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
