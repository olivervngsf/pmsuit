import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTeamBySlug } from "@/lib/queries";
import { ProjectCard } from "@/components/ProjectCard";
import { OutcomeRow } from "@/components/Outcome";
import { StatCard, SectionTitle } from "@/components/ui";
import { activeProjectCounts } from "@/lib/insights";
import { initials } from "@/lib/format";

// Pre-render every team page at build time (static export).
export async function generateStaticParams() {
  const teams = await prisma.team.findMany({ select: { slug: true } });
  return teams.map((t) => ({ slug: t.slug }));
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) notFound();

  const blocked = team.projects.reduce((a, p) => a + p.metrics.blocked, 0);
  const velocity = team.projects.reduce(
    (a, p) => a + p.metrics.velocityLast7,
    0,
  );
  const active = activeProjectCounts(team.projects);

  return (
    <div>
      <Link href="/teams" className="text-sm text-slate-500 hover:text-slate-300">
        ← Teams
      </Link>

      <header className="mt-3 mb-6 flex items-center gap-3">
        <span
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: team.color }}
        />
        <h1 className="text-2xl font-semibold text-white">{team.name}</h1>
        {team.lead && (
          <span className="text-sm text-slate-500">· Lead {team.lead}</span>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="People" value={team.members.length} />
        <StatCard label="Projects" value={team.projects.length} />
        <StatCard label="Owned outcomes" value={team.outcomeViews.length} />
        <StatCard
          label="Velocity (7d)"
          value={velocity}
          sub={`${blocked} blocked`}
          tone={blocked > 0 ? "warn" : "good"}
        />
      </div>

      {/* Projects this team is working on, by time window. */}
      <div className="mt-3 card p-4">
        <div className="label mb-3">Projects worked on</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "This week", value: active.week },
            { label: "This month", value: active.month },
            { label: "This year", value: active.year },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-semibold text-white">{s.value}</div>
              <div className="mt-1 text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {team.outcomeViews.length > 0 && (
        <section className="mt-8">
          <SectionTitle>Outcomes this team owns</SectionTitle>
          <div className="card divide-y divide-line px-4">
            {team.outcomeViews.map((o) => (
              <div key={o.id}>
                <OutcomeRow outcome={o} />
                {(o as any).initiative && (
                  <Link
                    href={`/initiatives/${(o as any).initiative.id}`}
                    className="mb-2 block text-[11px] text-slate-600 hover:text-slate-400"
                  >
                    ◆ {(o as any).initiative.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <SectionTitle>Projects</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {team.projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle>People</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {team.members.map((mem) => (
            <div
              key={mem.id}
              className="card flex items-center gap-3 p-3 text-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-overlay text-slate-300">
                {mem.avatar ?? initials(mem.name)}
              </span>
              <div>
                <div className="text-slate-200">{mem.name}</div>
                {mem.role && (
                  <div className="text-xs text-slate-500">{mem.role}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
