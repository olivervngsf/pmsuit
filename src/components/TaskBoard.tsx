"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
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
  key?: string | null;
  title: string;
  status: string;
  priority: string;
  assignee: string | null;
  effort: number;
  dueDate: Date | string | null;
};

// Drag a task card and drop it on a column to change its status.
export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  const router = useRouter();
  const [items, setItems] = useState(tasks);
  const [busy, setBusy] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  async function setStatus(id: string, status: TaskStatus) {
    const current = items.find((t) => t.id === id);
    if (!current || current.status === status) return;
    setBusy(id);
    // Optimistic update.
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t)),
    );
    try {
      // Persist to the backend when one exists. In the static demo build there
      // is no API, so this fails silently and the optimistic update stands.
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } catch {
      // Static demo: keep the optimistic, in-memory move.
    } finally {
      setBusy(null);
    }
  }

  function onDrop(status: TaskStatus) {
    if (draggingId) setStatus(draggingId, status);
    setDraggingId(null);
    setDragOver(null);
  }

  const columns = TASK_STATUS_ORDER.map((status) => ({
    status,
    meta: TASK_STATUS_META[status],
    tasks: items.filter((t) => t.status === status),
  }));

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => {
        const isTarget = dragOver === col.status;
        return (
          <div
            key={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOver !== col.status) setDragOver(col.status);
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(col.status);
            }}
            className={`rounded-xl border bg-surface-raised/40 p-2.5 transition ${
              isTarget
                ? "border-brand/60 bg-brand/5 ring-1 ring-brand/40"
                : "border-line"
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className={`text-xs font-semibold ${col.meta.text}`}>
                {col.meta.label}
              </span>
              <span className="text-xs text-slate-600">{col.tasks.length}</span>
            </div>
            <div className="min-h-[2rem] space-y-2">
              {col.tasks.map((t) => {
                const pri = PRIORITY_META[t.priority as Priority];
                const overdue =
                  t.status !== "DONE" &&
                  t.dueDate != null &&
                  new Date(t.dueDate) < new Date();
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", t.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(t.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOver(null);
                    }}
                    className={`group flex cursor-grab gap-1.5 rounded-lg border border-line bg-surface-overlay/60 p-2.5 text-sm transition hover:border-brand/40 active:cursor-grabbing ${
                      draggingId === t.id ? "opacity-40" : ""
                    } ${busy === t.id ? "opacity-50" : ""}`}
                  >
                    <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600 group-hover:text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-slate-200">{t.title}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                        {t.key && (
                          <span className="font-mono text-[10px] text-slate-500">
                            {t.key}
                          </span>
                        )}
                        <span className={`chip ${pri.bg} ${pri.text}`}>
                          {pri.label}
                        </span>
                        <span className="text-slate-600">{t.effort} pts</span>
                        {t.assignee && (
                          <span className="text-slate-500">· {t.assignee}</span>
                        )}
                        {t.dueDate && (
                          <span
                            className={
                              overdue ? "text-amber-400" : "text-slate-600"
                            }
                          >
                            · {relativeDays(t.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {col.tasks.length === 0 && (
                <div
                  className={`rounded-lg border border-dashed px-1 py-4 text-center text-xs transition ${
                    isTarget
                      ? "border-brand/40 text-brand-soft"
                      : "border-line/60 text-slate-700"
                  }`}
                >
                  {isTarget ? "Drop here" : "—"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
