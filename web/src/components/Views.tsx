"use client";

import type { ReactNode } from "react";
import {
  Files,
  Moon,
  Radar,
  Code2,
  ShieldAlert,
  ExternalLink,
  ArrowRight,
  Send,
  FolderGit2,
  Globe,
  Wrench,
  Rocket,
} from "lucide-react";
import type { IdeaCard, IdeationResult, SignalBundle, View } from "@/lib/types";
import { IdeaCardView } from "@/components/IdeaCardView";

function RepoHeader({ data }: { data: IdeationResult }) {
  return (
    <div className="card p-5 mb-6 flex items-start justify-between gap-6">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-[20px] font-semibold">{data.repo.repo}</h1>
          <span className="chip" style={{ background: "var(--brand-tint)", color: "var(--brand-500)" }}>{data.repo.framework}</span>
          <span className="chip" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}><Files size={12} /> {data.repo.fileCount} files</span>
        </div>
        <p className="text-[13.5px] mt-2 max-w-2xl" style={{ color: "var(--text-2)" }}>{data.repo.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {data.repo.keyAreas.map((a) => (
            <span key={a} className="chip" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{a}</span>
          ))}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="flex items-center gap-1.5 text-[12px] justify-end" style={{ color: "var(--text-3)" }}><Moon size={13} /> ideated overnight</div>
        <div className="text-[12px] mt-1 font-mono" style={{ color: "var(--text-3)" }}>{new Date(data.generatedAt).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}

/* ─── Dashboard: overview + two persona entries ─── */
export function DashboardView({ data, signals, onNavigate }: { data: IdeationResult; signals: SignalBundle | null; onNavigate: (v: View) => void }) {
  const nextCount = data.cards.filter((c) => c.track === "whats_next").length;
  const upCount = data.cards.filter((c) => c.track === "level_up").length;
  const tiles = [
    { view: "signals" as View, icon: Radar, accent: "var(--purple-500)", tint: "var(--purple-tint)", title: "Market Signals", who: "Business team", desc: `${signals?.competitors.length ?? 0} competitors watched · ${nextCount} new-product ideas`, cta: "See what competitors are doing" },
    { view: "codebase" as View, icon: Code2, accent: "var(--brand-500)", tint: "var(--brand-tint)", title: "Codebase", who: "Engineering team", desc: `${upCount} improvements · build & preview in a sandbox`, cta: "Keep innovating on your product" },
  ];
  return (
    <>
      <RepoHeader data={data} />
      <div className="grid md:grid-cols-2 gap-4">
        {tiles.map((t) => (
          <button key={t.view} onClick={() => onNavigate(t.view)} className="card p-6 text-left flex flex-col gap-3">
            <span className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: t.tint }}>
              <t.icon size={22} style={{ color: t.accent }} strokeWidth={1.9} />
            </span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: t.accent }}>{t.who}</div>
              <div className="text-[18px] font-semibold mt-0.5">{t.title}</div>
              <p className="text-[13px] mt-1.5" style={{ color: "var(--text-2)" }}>{t.desc}</p>
            </div>
            <span className="flex items-center gap-1.5 text-[13px] font-medium mt-auto" style={{ color: t.accent }}>{t.cta} <ArrowRight size={15} /></span>
          </button>
        ))}
      </div>
    </>
  );
}

/* ─── Market Signals: Business persona ─── */
export function SignalsView({ data, signals, onBuild, buildPanel }: { data: IdeationResult; signals: SignalBundle | null; onBuild: (c: IdeaCard) => void; buildPanel: ReactNode }) {
  const cards = data.cards.filter((c) => c.track === "whats_next");
  const comps = signals?.competitors ?? [];
  const cves = signals?.cves ?? [];
  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <Radar size={20} style={{ color: "var(--purple-500)" }} />
        <h1 className="text-[20px] font-semibold">Market Signals</h1>
      </div>
      <p className="text-[13.5px] mb-6" style={{ color: "var(--text-2)" }}>Live competitor &amp; market intelligence — scraped through Oxylabs. Turned into new-product moves.</p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* signal feed */}
        <div className="lg:col-span-1">
          <div className="text-[12px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: "var(--text-3)" }}>Competitor feed</div>
          <div className="space-y-3">
            {comps.length === 0 && cves.length === 0 && (
              <div className="card p-4 text-[13px]" style={{ color: "var(--text-2)" }}>Watching competitors… signals refresh in the background.</div>
            )}
            {comps.map((c) => (
              <a key={c.name} href={c.url} target="_blank" className="card p-4 block">
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-semibold">{c.name}</span>
                  <span className="text-[11px] font-mono" style={{ color: "var(--text-3)" }}>{c.date}</span>
                </div>
                <p className="text-[12.5px] mt-1.5 line-clamp-3" style={{ color: "var(--text-2)" }}>{c.summary}</p>
                <span className="chip mt-2" style={{ background: "var(--purple-tint)", color: "var(--purple-500)" }}><Radar size={11} /> live via Oxylabs</span>
              </a>
            ))}
            {cves.map((v) => (
              <a key={v.id} href={v.url} target="_blank" className="card p-4 block">
                <div className="flex items-center gap-1.5"><ShieldAlert size={14} style={{ color: "var(--red-500)" }} /><span className="text-[13px] font-semibold">{v.id}</span></div>
                <p className="text-[12.5px] mt-1" style={{ color: "var(--text-2)" }}>{v.summary}</p>
                <div className="text-[11px] font-mono mt-1.5" style={{ color: "var(--text-3)" }}>{v.package}</div>
              </a>
            ))}
          </div>
        </div>

        {/* opportunity cards */}
        <div className="lg:col-span-2">
          <div className="text-[12px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: "var(--text-3)" }}>New-product opportunities</div>
          {buildPanel}
          <div className="grid md:grid-cols-2 gap-4">
            {cards.map((c) => <IdeaCardView key={c.id} card={c} onBuild={onBuild} />)}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Codebase: Engineering persona ─── */
export function CodebaseView({ data, onBuild, buildPanel }: { data: IdeationResult; onBuild: (c: IdeaCard) => void; buildPanel: ReactNode }) {
  const cards = data.cards.filter((c) => c.track === "level_up");
  return (
    <>
      <RepoHeader data={data} />
      <div className="flex items-center gap-2 mb-1">
        <Wrench size={18} style={{ color: "var(--brand-500)" }} />
        <h2 className="text-[16px] font-semibold">Level Up — improve what you have</h2>
      </div>
      <p className="text-[13px] mb-5" style={{ color: "var(--text-2)" }}>Repo-grounded fixes. Approve one → built &amp; previewed live in a Daytona sandbox.</p>
      {buildPanel}
      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
        {cards.map((c) => <IdeaCardView key={c.id} card={c} onBuild={onBuild} />)}
      </div>
    </>
  );
}

/* ─── Activity ─── */
export function ActivityView({ jobs }: { jobs: { title: string; status: string; url?: string }[] }) {
  return (
    <>
      <h1 className="text-[20px] font-semibold mb-1">Activity</h1>
      <p className="text-[13.5px] mb-6" style={{ color: "var(--text-2)" }}>Builds SleepMode PM has run this session.</p>
      {jobs.length === 0 ? (
        <div className="card p-6 text-[13.5px]" style={{ color: "var(--text-2)" }}>No builds yet — approve a card to see it here.</div>
      ) : (
        <div className="space-y-2.5">
          {jobs.map((j, i) => (
            <div key={i} className="card p-4 flex items-center justify-between">
              <span className="text-[14px] font-medium">{j.title}</span>
              <div className="flex items-center gap-3">
                <span className="chip" style={{ background: j.status === "ready" ? "var(--green-tint)" : "var(--surface-2)", color: j.status === "ready" ? "var(--green-text)" : "var(--text-2)" }}>{j.status}</span>
                {j.url && <a href={j.url} target="_blank" className="text-[13px] flex items-center gap-1" style={{ color: "var(--brand-500)" }}>preview <ExternalLink size={12} /></a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ─── Settings ─── */
export function SettingsView({ repo }: { repo?: string }) {
  const rows = [
    { icon: FolderGit2, label: "GitHub repo", value: repo ?? "—", ok: !!repo, accent: "var(--brand-500)" },
    { icon: Globe, label: "Company website", value: "indexed · competitor watch on", ok: true, accent: "var(--purple-500)" },
    { icon: Send, label: "Telegram notifications", value: "message @SleepModePM_bot to link", ok: true, accent: "var(--brand-500)" },
  ];
  return (
    <>
      <h1 className="text-[20px] font-semibold mb-1">Settings</h1>
      <p className="text-[13.5px] mb-6" style={{ color: "var(--text-2)" }}>Connected sources &amp; integrations.</p>
      <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-5 py-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3">
              <r.icon size={18} style={{ color: r.accent }} />
              <div>
                <div className="text-[14px] font-medium">{r.label}</div>
                <div className="text-[12.5px]" style={{ color: "var(--text-2)" }}>{r.value}</div>
              </div>
            </div>
            <span className="chip" style={{ background: "var(--green-tint)", color: "var(--green-text)" }}>active</span>
          </div>
        ))}
      </div>
    </>
  );
}
