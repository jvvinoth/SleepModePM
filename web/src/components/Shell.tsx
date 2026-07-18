"use client";

import {
  Moon,
  LayoutDashboard,
  Radar,
  Code2,
  Activity,
  Settings,
  FolderGit2,
  Plus,
} from "lucide-react";
import type { View } from "@/lib/types";

const NAV: { view: View; icon: typeof Radar; label: string; group?: string }[] = [
  { view: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { view: "signals", icon: Radar, label: "Market Signals", group: "Business team" },
  { view: "codebase", icon: Code2, label: "Codebase", group: "Engineering team" },
  { view: "activity", icon: Activity, label: "Activity" },
  { view: "settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ active, onNavigate }: { active: View; onNavigate: (v: View) => void }) {
  return (
    <aside
      className="fixed inset-y-0 left-0 w-60 flex flex-col"
      style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2.5 px-5 h-14" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "var(--brand-500)" }}>
          <Moon size={17} color="#fff" strokeWidth={2.2} />
        </span>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold">SleepMode PM</div>
          <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
            works while you sleep
          </div>
        </div>
      </div>
      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {NAV.map(({ view, icon: Icon, label, group }) => {
          const on = active === view;
          const accent = view === "signals" ? "var(--purple-500)" : "var(--brand-500)";
          const tint = view === "signals" ? "var(--purple-tint)" : "var(--brand-tint)";
          return (
            <div key={view}>
              {group && (
                <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                  {group}
                </div>
              )}
              <button
                onClick={() => onNavigate(view)}
                className="relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium"
                style={on ? { background: tint, color: accent } : { color: "var(--text-2)" }}
              >
                {on && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full" style={{ background: accent }} />}
                <Icon size={19} strokeWidth={1.75} />
                {label}
              </button>
            </div>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-[11px]" style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
        Daytona · AI&amp; · Oxylabs · Doubleword
      </div>
    </aside>
  );
}

export function TopBar({
  repo,
  live,
  onConnect,
}: {
  repo?: string;
  live: boolean;
  onConnect: () => void;
}) {
  return (
    <header
      className="fixed top-0 left-60 right-0 h-14 flex items-center justify-between px-6 z-10"
      style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3">
        <FolderGit2 size={17} strokeWidth={1.75} style={{ color: "var(--text-2)" }} />
        <span className="text-[14px] font-medium">{repo ?? "No source connected"}</span>
        <span
          className="chip"
          style={live ? { background: "var(--green-tint)", color: "var(--green-text)" } : { background: "var(--surface-2)", color: "var(--text-3)" }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${live ? "pulse" : ""}`} style={{ background: live ? "var(--green-500)" : "var(--text-3)" }} />
          {live ? "Agents live" : "idle"}
        </span>
      </div>
      <button className="btn-primary flex items-center gap-1.5" onClick={onConnect}>
        <Plus size={15} strokeWidth={2.4} /> Connect source
      </button>
    </header>
  );
}
