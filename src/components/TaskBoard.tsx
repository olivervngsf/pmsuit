"use client";

import { useState } from "react";
import { GripVertical, Plus, Pencil, Trash2 } from "lucide-react";
import {
  TASK_STATUS_META,
  TASK_STATUS_ORDER,
  PRIORITY_META,
  type TaskStatus,
  type Priority,
} from "@/lib/types";
import { relativeDays } from "@/lib/format";
import { useLocalStore, localId } from "@/lib/useLocalStore";
import { Modal, Field, TextInput, Select } from "./Modal";

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

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function emptyTask(status: TaskStatus): BoardTask {
  return {
    id: "",
    key: null,
    title: "",
    status,
    priority: "MEDIUM",
    assignee: "",
    effort: 3,
    dueDate: null,
  };
}

function toDateInput(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

// Drag a card to a column to change status; add / edit / delete tasks inline.
// Tasks are stored per project in localStorage (seeded from the static build).
export function TaskBoard({
  tasks,
  projectId,
}: {
  tasks: BoardTask[];
  projectId: string;
}) {
  const { items, add, update, remove } = useLocalStore<BoardTask>(
    `pmsuit:tasks:${projectId}`,
    tasks,
  );

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BoardTask | null>(null);
  const [draft, setDraft] = useState<BoardTask>(emptyTask("TODO"));

  function nextKey(): string {
    let max = 0;
    for (const t of items) {
      const m = t.key?.match(/TASK-(\d+)/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `TASK-${max + 1}`;
  }

  function startAdd(status: TaskStatus) {
    setEditing(null);
    setDraft(emptyTask(status));
    setFormOpen(true);
  }
  function startEdit(t: BoardTask) {
    setEditing(t);
    setDraft({ ...t });
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setDraft(emptyTask("TODO"));
  }
  function save() {
    if (!draft.title.trim()) return;
    if (editing) {
      update(editing.id, draft);
    } else {
      add({ ...draft, id: localId("task"), key: nextKey() });
    }
    closeForm();
  }

  function onDrop(status: TaskStatus) {
    if (draggingId) {
      const t = items.find((x) => x.id === draggingId);
      if (t && t.status !== status) update(draggingId, { status });
    }
    setDraggingId(null);
    setDragOver(null);
  }

  const columns = TASK_STATUS_ORDER.map((status) => ({
    status,
    meta: TASK_STATUS_META[status],
    tasks: items.filter((t) => t.status === status),
  }));

  return (
    <>
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
              className={`flex flex-col rounded-xl border bg-surface-raised/40 p-2.5 transition ${
                isTarget
                  ? "border-brand/60 bg-brand/5 ring-1 ring-brand/40"
                  : "border-line"
              }`}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className={`text-xs font-semibold ${col.meta.text}`}>
                  {col.meta.label}
                </span>
                <span className="text-xs text-slate-600">
                  {col.tasks.length}
                </span>
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
                      }`}
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
                            <span className="text-slate-500">
                              · {t.assignee}
                            </span>
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
                      <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => startEdit(t)}
                          title="Edit task"
                          className="rounded p-1 text-slate-400 hover:bg-surface-overlay hover:text-white"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${t.title}"?`)) remove(t.id);
                          }}
                          title="Delete task"
                          className="rounded p-1 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {isTarget && (
                  <div className="rounded-lg border border-dashed border-brand/40 px-1 py-3 text-center text-xs text-brand-soft">
                    Drop here
                  </div>
                )}
              </div>

              <button
                onClick={() => startAdd(col.status)}
                className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-line py-1.5 text-xs text-slate-500 transition hover:border-brand/40 hover:text-slate-300"
              >
                <Plus className="h-3 w-3" /> Add task
              </button>
            </div>
          );
        })}
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Edit task" : "New task"}
        footer={
          <>
            <button onClick={closeForm} className="btn">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!draft.title.trim()}
              className="btn btn-primary"
            >
              {editing ? "Save changes" : "Add task"}
            </button>
          </>
        }
      >
        <Field label="Title">
          <TextInput
            value={draft.title}
            autoFocus
            placeholder="e.g. Wire SSO settings into the admin UI"
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Assignee">
            <TextInput
              value={draft.assignee ?? ""}
              placeholder="Name"
              onChange={(e) => setDraft({ ...draft, assignee: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            >
              {TASK_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Effort (points)">
            <TextInput
              type="number"
              min={0}
              value={String(draft.effort)}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  effort: Math.max(0, parseInt(e.target.value || "0", 10)),
                })
              }
            />
          </Field>
        </div>
        <Field label="Due date">
          <TextInput
            type="date"
            value={toDateInput(draft.dueDate)}
            onChange={(e) =>
              setDraft({
                ...draft,
                dueDate: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : null,
              })
            }
          />
        </Field>
      </Modal>
    </>
  );
}
