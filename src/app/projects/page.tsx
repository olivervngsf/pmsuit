import { getProjects } from "@/lib/queries";
import { ProjectCard } from "@/components/ProjectCard";
import { StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();

  const active = projects.filter((p) => p.status === "ACTIVE").length;
  const atRisk = projects.filter((p) => p.health !== "ON_TRACK").length;
  const blocked = projects.reduce((a, p) => a + p.metrics.blocked, 0);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Projects</h1>
        <p className="mt-1 text-sm text-slate-400">
          Every delivery project across the company, with live execution health.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={projects.length} />
        <StatCard label="Active" value={active} />
        <StatCard
          label="Off track / at risk"
          value={atRisk}
          tone={atRisk > 0 ? "warn" : "good"}
        />
        <StatCard
          label="Blocked tasks"
          value={blocked}
          tone={blocked > 0 ? "bad" : "good"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
