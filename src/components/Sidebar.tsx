"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Target,
  KanbanSquare,
  Users,
  Sparkles,
  ChevronsLeft,
  type LucideIcon,
} from "lucide-react";

const NAV: {
  href: string;
  label: string;
  Icon: LucideIcon;
  exact?: boolean;
}[] = [
  { href: "/", label: "Portfolio", Icon: LayoutGrid, exact: true },
  { href: "/initiatives", label: "Initiatives", Icon: Target },
  { href: "/projects", label: "Projects", Icon: KanbanSquare },
  { href: "/teams", label: "Teams", Icon: Users },
  { href: "/insights", label: "Weekly Check-in", Icon: Sparkles },
];

const STORAGE_KEY = "pmsuit:sidebar";

export function Sidebar({
  companyName,
  period,
}: {
  companyName: string;
  period: string;
}) {
  const pathname = usePathname();
  // Default to the compact icon rail; restore the saved preference on mount.
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setExpanded(window.localStorage.getItem(STORAGE_KEY) === "expanded");
  }, []);

  function toggle() {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "expanded" : "compact");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface-raised/60 p-3 backdrop-blur-sm transition-[width] duration-200 md:flex ${
        expanded ? "w-60" : "w-16"
      }`}
    >
      {/* Brand */}
      <Link
        href="/"
        className="mb-6 flex items-center gap-2 px-1.5 pt-1"
        title={companyName}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/20 font-semibold text-brand-soft">
          {companyName.charAt(0) || "◆"}
        </span>
        {expanded && (
          <div className="leading-tight">
            <div className="truncate text-sm font-semibold text-white">
              {companyName}
            </div>
            <div className="truncate text-xs text-slate-500">
              PM Suite · {period}
            </div>
          </div>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={expanded ? undefined : label}
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition ${
                active
                  ? "bg-brand/15 font-medium text-white"
                  : "text-slate-400 hover:bg-surface-overlay hover:text-slate-200"
              } ${expanded ? "" : "justify-center"}`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {expanded && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer: collapse toggle + demo note */}
      <div className="mt-auto flex flex-col gap-3">
        {expanded && (
          <div className="rounded-lg border border-line bg-surface-overlay/50 p-3 text-xs text-slate-500">
            <div className="mb-1 font-medium text-slate-400">Demo data</div>
            Fake people &amp; projects. Edits save in your browser only.
          </div>
        )}
        <button
          onClick={toggle}
          title={
            expanded
              ? "Switch to Compact (icons only)"
              : "Switch to Full (icons + text)"
          }
          className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-400 transition hover:bg-surface-overlay hover:text-slate-200 ${
            expanded ? "" : "justify-center"
          }`}
        >
          <ChevronsLeft
            className={`h-[18px] w-[18px] shrink-0 transition-transform ${
              expanded ? "" : "rotate-180"
            }`}
          />
          {expanded && <span>Compact</span>}
        </button>
      </div>
    </aside>
  );
}
