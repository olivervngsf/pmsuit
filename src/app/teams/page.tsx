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

            {/* Projects this team is working on, by time window. */}
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-line bg-surface-overlay/30 p-2 text-center">
              {[
                { label: "Week", value: team.active.week },
                { label: "Month", value: team.active.month },
                { label: "Year", value: team.active.year },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-lg font-semibold text-white">
                    {s.value}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    {s.label}
                  </div>
                </div>
              ))}
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
