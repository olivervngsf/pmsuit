import { getProjects, getTeams, getInitiatives } from "@/lib/queries";
import { ProjectsManager, type LocalProject } from "@/components/ProjectsManager";

export default async function ProjectsPage() {
  const [projects, teams, initiatives] = await Promise.all([
    getProjects(),
    getTeams(),
    getInitiatives(),
  ]);

  // Map the rich server rollups down to the serializable shape the client
  // CRUD manager works with (it overlays localStorage edits on top of this).
  const seed: LocalProject[] = projects.map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    impact: p.impact ?? "",
    status: p.status,
    health: p.health,
    teamSlug: p.team?.slug ?? null,
    teamName: p.team?.name ?? null,
    teamColor: p.team?.color ?? null,
    owner: p.lead ?? null,
    initiativeId: p.initiative?.id ?? null,
    initiativeName: p.initiative?.name ?? null,
    startDate: p.startDate.toISOString(),
    targetDate: p.targetDate ? p.targetDate.toISOString() : null,
    total: p.metrics.total,
    done: p.metrics.done,
    blocked: p.metrics.blocked,
    overdue: p.metrics.overdue,
    completionPct: p.metrics.completionPct,
  }));

  const teamOpts = teams.map((t) => ({
    slug: t.slug,
    name: t.name,
    color: t.color,
  }));

  // Initiatives + their success metrics, so the form can show what a project
  // contributes to when one is selected.
  const initiativeOpts = initiatives.map((i) => ({
    id: i.id,
    name: i.name,
    outcomes: i.outcomes.map((o) => ({ id: o.id, name: o.name })),
  }));

  return (
    <ProjectsManager
      seed={seed}
      teams={teamOpts}
      initiatives={initiativeOpts}
    />
  );
}
