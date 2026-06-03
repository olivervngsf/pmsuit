import { initials } from "@/lib/format";
import { TeamChip } from "./ui";

type Person = {
  id: string;
  name: string;
  role: string | null;
  avatar: string | null;
};

type TeamRef = { id: string; name: string; slug: string; color: string };

export type OwnerView =
  | (Person & { team: TeamRef | null })
  | null;

export type ContributorView = {
  id: string;
  responsibility: string;
  team: TeamRef | null;
  pointPerson: Person | null;
};

const RACI: Record<
  string,
  { label: string; text: string; bg: string; hint: string }
> = {
  ACCOUNTABLE: {
    label: "Accountable",
    text: "text-brand-soft",
    bg: "bg-brand/15",
    hint: "owns the outcome — the DRI",
  },
  RESPONSIBLE: {
    label: "Responsible",
    text: "text-sky-300",
    bg: "bg-sky-500/15",
    hint: "does the work",
  },
  CONTRIBUTING: {
    label: "Contributing",
    text: "text-slate-300",
    bg: "bg-slate-500/15",
    hint: "pitches in",
  },
  CONSULTED: {
    label: "Consulted",
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    hint: "gives input",
  },
  INFORMED: {
    label: "Informed",
    text: "text-slate-400",
    bg: "bg-slate-500/10",
    hint: "kept in the loop",
  },
};

function Avatar({ person }: { person: Person }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-slate-200">
      {person.avatar ?? initials(person.name)}
    </span>
  );
}

export function Ownership({
  owner,
  contributors,
}: {
  owner: OwnerView;
  contributors: ContributorView[];
}) {
  return (
    <div className="card p-4">
      {/* The single accountable owner — who to point at. */}
      <div className="label mb-2">Owner · single point of accountability</div>
      {owner ? (
        <div className="flex items-center gap-3">
          <Avatar person={owner} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{owner.name}</span>
              <span className="chip bg-brand/15 text-brand-soft">DRI</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
              {owner.role && <span>{owner.role}</span>}
              {owner.team && <TeamChip team={owner.team} href={`/teams/${owner.team.slug}`} />}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500">No owner assigned yet.</div>
      )}

      {contributors.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <div className="label mb-2">Who's involved · point people by function</div>
          <ul className="space-y-2">
            {contributors.map((c) => {
              const raci = RACI[c.responsibility] ?? RACI.CONTRIBUTING;
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {c.team && (
                      <TeamChip team={c.team} href={`/teams/${c.team.slug}`} />
                    )}
                    <span className="truncate text-slate-400">
                      {c.pointPerson ? c.pointPerson.name : "—"}
                      {c.pointPerson?.role && (
                        <span className="text-slate-600">
                          {" "}
                          · {c.pointPerson.role}
                        </span>
                      )}
                    </span>
                  </div>
                  <span
                    className={`chip shrink-0 ${raci.bg} ${raci.text}`}
                    title={raci.hint}
                  >
                    {raci.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
