"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Portfolio", icon: "◧", exact: true },
  { href: "/initiatives", label: "Initiatives", icon: "◆" },
  { href: "/projects", label: "Projects", icon: "▦" },
  { href: "/teams", label: "Teams", icon: "⬡" },
  { href: "/insights", label: "Weekly Check-in", icon: "✦" },
];

export function Sidebar({
  companyName,
  period,
}: {
  companyName: string;
  period: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface-raised/60 p-4 backdrop-blur-sm md:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2 pt-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/20 text-brand-soft">
          ◆
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">{companyName}</div>
          <div className="text-xs text-slate-500">PM Suite · {period}</div>
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-brand/15 font-medium text-white"
                  : "text-slate-400 hover:bg-surface-overlay hover:text-slate-200"
              }`}
            >
              <span className="w-4 text-center text-xs opacity-80">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-line bg-surface-overlay/50 p-3 text-xs text-slate-500">
        <div className="mb-1 font-medium text-slate-400">Demo data</div>
        Fake people &amp; projects. Swap for real data in{" "}
        <code className="text-brand-soft">prisma/seed.ts</code>.
      </div>
    </aside>
  );
}
