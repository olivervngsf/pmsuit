"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  LayoutGrid,
  List,
  CalendarDays,
  Link2,
  AlertTriangle,
  X,
} from "lucide-react";
import { useLocalStore, localId } from "@/lib/useLocalStore";
import { Modal, Field, TextInput, TextArea, Select } from "./Modal";
import {
  HealthBadge,
  ProgressBar,
  StatCard,
  TeamChip,
  KeyTag,
  Deadline,
} from "./ui";
import { RoadmapCalendar } from "./RoadmapCalendar";
import { STATUS_LABEL, type Health, type LifecycleStatus } from "@/lib/types";

export type LocalProject = {
  id: string;
  key: string | null;
  name: string;
  impact: string;
  status: string;
  health: string;
  teamSlug: string | null;
  teamName: string | null;
  teamColor: string | null;
  owner: string | null;
  initiativeId: string | null;
  initiativeName: string | null;
  // ISO date strings — drive the calendar/roadmap view.
  startDate: string;
  targetDate: string | null;
  // Snapshot metrics (0 for user-created projects).
  total: number;
  done: number;
  blocked: number;
  overdue: number;
  completionPct: number;
};

type TeamOpt = { slug: string; name: string; color: string };
type InitiativeOpt = {
  id: string;
  name: string;
  outcomes: { id: string; name: string }[];
};

const STATUSES: LifecycleStatus[] = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
];
const HEALTHS: Health[] = ["ON_TRACK", "AT_RISK", "OFF_TRACK"];

const emptyDraft = (): LocalProject => ({
  id: "",
  key: null,
  name: "",
  impact: "",
  status: "PLANNING",
  health: "ON_TRACK",
  teamSlug: null,
  teamName: null,
  teamColor: null,
  owner: "",
  initiativeId: null,
  initiativeName: null,
  startDate: new Date().toISOString(),
  targetDate: null,
  total: 0,
  done: 0,
  blocked: 0,
  overdue: 0,
  completionPct: 0,
});

type View = "grid" | "list" | "calendar";

export function ProjectsManager({
  seed,
  teams,
  initiatives,
}: {
  seed: LocalProject[];
  teams: TeamOpt[];
  initiatives: InitiativeOpt[];
}) {
  const { items, add, update, remove, reset, hydrated } = useLocalStore<LocalProject>(
    "pmsuit:projects",
    seed,
  );

  const [editing, setEditing] = useState<LocalProject | null>(null);
  const [draft, setDraft] = useState<LocalProject>(emptyDraft());
  const [formOpen, setFormOpen] = useState(false);

  // View and team filter are encoded in the URL (?view=…&team=…) so the link
  // remembers them — save or share the URL and the filter comes back.
  const [view, setView] = useState<View>("grid");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [teamFilter, setTeamFilter] = useState<string>("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    if (v === "calendar" || v === "list") setView(v);
    const t = params.get("team");
    if (t) setTeamFilter(t);
  }, []);

  function changeView(next: View) {
    setView(next);
    const url = new URL(window.location.href);
    if (next === "grid") url.searchParams.delete("view");
    else url.searchParams.set("view", next);
    window.history.replaceState(null, "", url.toString());
  }

  function changeTeam(slug: string) {
    setTeamFilter(slug);
    const url = new URL(window.location.href);
    if (slug === "all") url.searchParams.delete("team");
    else url.searchParams.set("team", slug);
    window.history.replaceState(null, "", url.toString());
  }

  // Next PRJ-n for a newly created project (after the highest existing number).
  function nextKey(): string {
    let max = 0;
    for (const p of items) {
      const m = p.key?.match(/PRJ-(\d+)/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `PRJ-${max + 1}`;
  }

  const filtered = useMemo(
    () =>
      teamFilter === "all"
        ? items
        : items.filter((p) => p.teamSlug === teamFilter),
    [items, teamFilter],
  );

  const stats = useMemo(() => {
    const active = filtered.filter((p) => p.status === "ACTIVE").length;
    const atRisk = filtered.filter((p) => p.health !== "ON_TRACK").length;
    const blocked = filtered.reduce((a, p) => a + (p.blocked || 0), 0);
    return { total: filtered.length, active, atRisk, blocked };
  }, [filtered]);

  function closeForm() {
    setDraft(emptyDraft());
    setEditing(null);
    setFormOpen(false);
  }
  function startNew() {
    setEditing(null);
    setDraft(emptyDraft());
    setFormOpen(true);
  }
  function startEdit(p: LocalProject) {
    setEditing(p);
    setDraft({ ...p });
    setFormOpen(true);
  }

  function applyTeam(slug: string) {
    const t = teams.find((x) => x.slug === slug) ?? null;
    setDraft((d) => ({
      ...d,
      teamSlug: t?.slug ?? null,
      teamName: t?.name ?? null,
      teamColor: t?.color ?? null,
    }));
  }

  function applyInitiative(id: string) {
    const i = initiatives.find((x) => x.id === id) ?? null;
    setDraft((d) => ({
      ...d,
      initiativeId: i?.id ?? null,
      initiativeName: i?.name ?? null,
    }));
  }

  const selectedInitiative = initiatives.find((i) => i.id === draft.initiativeId);

  function save() {
    if (!draft.name.trim()) return;
    if (editing) {
      update(editing.id, draft);
    } else {
      add({ ...draft, id: localId("proj"), key: nextKey() });
    }
    closeForm();
  }

  const isLocal = (id: string) => id.startsWith("proj_") || id.startsWith("loc");

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="mt-1 text-sm text-slate-400">
            Every delivery project across the company. Create, edit, and delete —
            changes save in your browser.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* View switcher — the choice is saved in the URL so it's shareable. */}
          <div className="flex rounded-lg border border-line bg-surface-overlay/40 p-0.5">
            {(
              [
                { key: "grid", label: "Cards", Icon: LayoutGrid },
                { key: "list", label: "List", Icon: List },
                { key: "calendar", label: "Calendar", Icon: CalendarDays },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => changeView(key)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${
                  view === key
                    ? "bg-brand/20 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          <button onClick={startNew} className="btn btn-primary">
            <Plus className="h-4 w-4" /> New project
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard
          label="Off track / at risk"
          value={stats.atRisk}
          tone={stats.atRisk > 0 ? "warn" : "good"}
        />
        <StatCard
          label="Blocked tasks"
          value={stats.blocked}
          tone={stats.blocked > 0 ? "bad" : "good"}
        />
      </div>

      {/* Team filter — saved in the URL (?team=…) so the link remembers it. */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-slate-500">Team</span>
        <button
          onClick={() => changeTeam("all")}
          className={`chip border transition ${
            teamFilter === "all"
              ? "border-brand/50 bg-brand/15 text-white"
              : "border-line bg-surface-overlay/40 text-slate-400 hover:text-slate-200"
          }`}
        >
          All
        </button>
        {teams.map((t) => {
          const active = teamFilter === t.slug;
          return (
            <button
              key={t.slug}
              onClick={() => changeTeam(t.slug)}
              className="chip border transition"
              style={{
                color: active ? "#fff" : t.color,
                borderColor: active ? t.color : `${t.color}55`,
                backgroundColor: active ? `${t.color}33` : `${t.color}14`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              {t.name}
              {active && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${t.name} filter`}
                  onClick={(e) => {
                    e.stopPropagation();
                    changeTeam("all");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      changeTeam("all");
                    }
                  }}
                  className="-mr-1 ml-0.5 flex h-4 w-4 items-center justify-center rounded-full transition hover:bg-black/25"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
        {teamFilter !== "all" && (
          <span className="text-xs text-slate-500">
            · {filtered.length} of {items.length}
          </span>
        )}
      </div>

      {view === "calendar" && (
        <RoadmapCalendar
          projects={filtered}
          year={year}
          onYearChange={setYear}
          onEdit={startEdit}
        />
      )}

      {view === "list" && (
        <div className="card divide-y divide-line">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <KeyTag id={p.key} />
                {isLocal(p.id) ? (
                  <button
                    onClick={() => startEdit(p)}
                    className="truncate text-left text-sm font-medium text-white hover:text-brand-soft"
                  >
                    {p.name || "Untitled project"}
                  </button>
                ) : (
                  <Link
                    href={`/projects/${p.id}`}
                    className="truncate text-sm font-medium text-white hover:text-brand-soft"
                  >
                    {p.name}
                  </Link>
                )}
                {p.initiativeName ? (
                  <span className="hidden truncate text-xs text-slate-500 lg:inline">
                    ◆ {p.initiativeName}
                  </span>
                ) : (
                  <span className="chip border border-amber-500/30 bg-amber-500/10 text-amber-300">
                    <AlertTriangle className="h-3 w-3" /> Unaligned
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                {p.teamSlug && p.teamName && p.teamColor && (
                  <TeamChip
                    team={{ slug: p.teamSlug, name: p.teamName, color: p.teamColor }}
                  />
                )}
                <Deadline date={p.targetDate} done={p.status === "COMPLETED"} />
                <span className="hidden w-20 sm:block">
                  <ProgressBar
                    pct={p.completionPct}
                    color={p.teamColor ?? undefined}
                  />
                </span>
                <span className="hidden w-9 text-right text-xs tabular-nums text-slate-400 sm:block">
                  {p.completionPct}%
                </span>
                <HealthBadge health={p.health as Health} />
                <span className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => startEdit(p)}
                    title="Edit"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-surface-overlay hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"?`)) remove(p.id);
                    }}
                    title="Delete"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "grid" && (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="card group relative p-4 transition hover:border-brand/40"
          >
            {/* Edit / delete actions */}
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
              <button
                onClick={() => startEdit(p)}
                title="Edit"
                className="rounded-md p-1.5 text-slate-400 hover:bg-surface-overlay hover:text-white"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${p.name}"?`)) remove(p.id);
                }}
                title="Delete"
                className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="pr-12">
              <div className="mb-0.5">
                <KeyTag id={p.key} />
              </div>
              {isLocal(p.id) ? (
                <button
                  onClick={() => startEdit(p)}
                  className="text-left font-medium text-white hover:text-brand-soft"
                >
                  {p.name || "Untitled project"}
                </button>
              ) : (
                <Link
                  href={`/projects/${p.id}`}
                  className="font-medium text-white hover:text-brand-soft"
                >
                  {p.name}
                </Link>
              )}
            </div>

            {/* Commitment + alignment, visible up front. */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Deadline
                date={p.targetDate}
                done={p.status === "COMPLETED"}
              />
              {p.initiativeName ? (
                <span
                  className="chip border border-brand/30 bg-brand/10 text-brand-soft"
                  title={`Aligned to: ${p.initiativeName}`}
                >
                  <Link2 className="h-3 w-3" />
                  <span className="max-w-[10rem] truncate">
                    {p.initiativeName}
                  </span>
                </span>
              ) : (
                <span
                  className="chip border border-amber-500/30 bg-amber-500/10 text-amber-300"
                  title="Not linked to any initiative — is this project meaningful?"
                >
                  <AlertTriangle className="h-3 w-3" /> Unaligned
                </span>
              )}
            </div>

            {p.impact && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">{p.impact}</p>
            )}

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {p.done}/{p.total} tasks
                </span>
                <span>{p.completionPct}%</span>
              </div>
              <ProgressBar pct={p.completionPct} color={p.teamColor ?? "#6366f1"} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <HealthBadge health={p.health as Health} />
              {p.teamSlug && p.teamName && p.teamColor && (
                <TeamChip
                  team={{ slug: p.teamSlug, name: p.teamName, color: p.teamColor }}
                />
              )}
              {p.owner && <span className="text-slate-500">· {p.owner}</span>}
              {isLocal(p.id) && (
                <span className="chip bg-brand/10 text-brand-soft">local</span>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {hydrated && filtered.length === 0 && (
        <div className="card p-10 text-center text-sm text-slate-500">
          {teamFilter === "all" ? (
            <>
              No projects. Click{" "}
              <span className="text-brand-soft">New project</span> to add one.
            </>
          ) : (
            <>
              No projects for this team.{" "}
              <button
                onClick={() => changeTeam("all")}
                className="text-brand-soft hover:underline"
              >
                Clear filter
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => {
            if (confirm("Reset to the original demo projects?")) reset();
          }}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300"
        >
          <RotateCcw className="h-3 w-3" /> Reset to demo data
        </button>
      </div>

      {/* Create / edit form */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Edit project" : "New project"}
        footer={
          <>
            <button onClick={closeForm} className="btn">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!draft.name.trim()}
              className="btn btn-primary"
            >
              {editing ? "Save changes" : "Create project"}
            </button>
          </>
        }
      >
        <Field label="Name">
          <TextInput
            value={draft.name}
            autoFocus
            placeholder="e.g. Fall launch campaign"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Field>
        <Field label="Impact (what it delivers)">
          <TextArea
            value={draft.impact}
            placeholder="The outcome this project creates…"
            onChange={(e) => setDraft({ ...draft, impact: e.target.value })}
          />
        </Field>

        {/* Strategic alignment: connect the project to an initiative and see
            the success metrics it will contribute to. */}
        <Field label="Initiative (what this project drives)">
          <Select
            value={draft.initiativeId ?? ""}
            onChange={(e) => applyInitiative(e.target.value)}
          >
            <option value="">— none (unaligned) —</option>
            {initiatives.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </Field>
        {selectedInitiative && selectedInitiative.outcomes.length > 0 && (
          <div className="rounded-lg border border-brand/20 bg-brand/5 p-3">
            <div className="label mb-1 text-brand-soft">
              Success metrics it contributes to
            </div>
            <ul className="space-y-0.5">
              {selectedInitiative.outcomes.map((o) => (
                <li key={o.id} className="flex gap-2 text-xs text-slate-300">
                  <span className="text-brand-soft">•</span>
                  {o.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Team">
            <Select
              value={draft.teamSlug ?? ""}
              onChange={(e) => applyTeam(e.target.value)}
            >
              <option value="">— none —</option>
              {teams.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Owner (DRI)">
            <TextInput
              value={draft.owner ?? ""}
              placeholder="Name"
              onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Health">
            <Select
              value={draft.health}
              onChange={(e) => setDraft({ ...draft, health: e.target.value })}
            >
              {HEALTHS.map((h) => (
                <option key={h} value={h}>
                  {h.replace("_", " ").toLowerCase()}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Target date (shows on calendar)">
            <TextInput
              type="date"
              value={draft.targetDate ? draft.targetDate.slice(0, 10) : ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  targetDate: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
