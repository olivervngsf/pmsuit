import Link from "next/link";
import { getTeams } from "@/lib/queries";
import { initials } from "@/lib/format";


export default async function TeamsPage() {
  const teams = await getTeams();
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Teams</h1>
        <p className="mt-1 text-sm text-slate-400">
          Cross-functional teams contributing to company outcomes.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.slug}`}
            className="card group block p-5 transition hover:border-brand/40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <h3 className="text-lg font-semibold text-white group-hover:text-brand-soft">
                  {team.name}
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {team.members.length} people
              </span>
            </div>
            {team.lead && (
              <div className="mt-1 text-xs text-slate-500">Lead: {team.lead}</div>
            )}

            <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
              <span>
                <span className="font-semibold text-white">
                  {team._count.projects}
                </span>{" "}
                projects
              </span>
              <span>
                <span className="font-semibold text-white">
                  {team._count.outcomes}
                </span>{" "}
                outcomes
              </span>
            </div>

            <div className="mt-4 flex -space-x-2">
              {team.members.slice(0, 6).map((mem) => (
                <span
                  key={mem.id}
                  title={`${mem.name}${mem.role ? ` · ${mem.role}` : ""}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-surface bg-surface-overlay text-xs text-slate-300"
                >
                  {mem.avatar ?? initials(mem.name)}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
