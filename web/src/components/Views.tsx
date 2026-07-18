"use client";

import type { ReactNode } from "react";
import {
  Files,
  Moon,
  Code2,
  ExternalLink,
  ArrowRight,
  Send,
  FolderGit2,
  Globe,
  Wrench,
  Flame,
  MessageCircle,
  Phone,
  Mail,
  Users,
} from "lucide-react";
import type { Channel, IdeaCard, IdeationResult, View } from "@/lib/types";
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
export function DashboardView({ data, onNavigate }: { data: IdeationResult; onNavigate: (v: View) => void }) {
  const upCount = data.cards.filter((c) => c.track === "level_up").length;
  const tiles = [
    { view: "leads" as View, icon: Flame, accent: "var(--purple-500)", tint: "var(--purple-tint)", title: "Leads", who: "Business team", desc: "Knowledge base trained · hot leads scored & routed to your team", cta: "See who's ready to buy" },
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

/* (Market Signals view removed — Business side is now Knowledge Base + Leads) */

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

/* ─── Settings: sources + notification channels ─── */
export function SettingsView({ repo, channels }: { repo?: string; channels: Channel[] }) {
  const sources = [
    { icon: FolderGit2, label: "GitHub repo", value: repo ?? "—", accent: "var(--brand-500)" },
    { icon: Globe, label: "Company website", value: "monstarx.com · 157 docs indexed", accent: "var(--purple-500)" },
  ];
  const CH_ICON: Record<string, typeof Send> = { telegram: Send, slack: MessageCircle, whatsapp: Phone, email: Mail, teams: Users };
  return (
    <>
      <h1 className="text-[20px] font-semibold mb-1">Settings</h1>
      <p className="text-[13.5px] mb-6" style={{ color: "var(--text-2)" }}>Connected sources &amp; where hot-lead alerts are delivered.</p>

      <div className="text-[12px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: "var(--text-3)" }}>Connected sources</div>
      <div className="card divide-y mb-8" style={{ borderColor: "var(--border)" }}>
        {sources.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-5 py-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3">
              <r.icon size={18} style={{ color: r.accent }} />
              <div>
                <div className="text-[14px] font-medium">{r.label}</div>
                <div className="text-[12.5px]" style={{ color: "var(--text-2)" }}>{r.value}</div>
              </div>
            </div>
            <span className="chip" style={{ background: "var(--green-tint)", color: "var(--green-text)" }}>connected</span>
          </div>
        ))}
      </div>

      <div className="text-[12px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: "var(--text-3)" }}>Hot-lead notifications</div>
      <div className="grid md:grid-cols-2 gap-3">
        {channels.map((c) => {
          const Icon = CH_ICON[c.id] ?? Send;
          const soon = c.status === "coming_soon";
          return (
            <div key={c.id} className="card p-4 flex items-center justify-between" style={soon ? { opacity: 0.6 } : {}}>
              <div className="flex items-center gap-3">
                <Icon size={18} style={{ color: soon ? "var(--text-3)" : "var(--brand-500)" }} />
                <span className="text-[14px] font-medium">{c.name}</span>
              </div>
              {soon ? (
                <span className="chip" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>Coming soon</span>
              ) : c.enabled ? (
                <span className="chip" style={{ background: "var(--green-tint)", color: "var(--green-text)" }}><CheckSm /> Connected</span>
              ) : (
                <button className="btn-ghost text-[13px]">Connect</button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[12.5px] mt-3" style={{ color: "var(--text-3)" }}>Telegram: message @SleepModePM_bot to link. Slack: add an incoming-webhook URL.</p>
    </>
  );
}

function CheckSm() {
  return <span style={{ fontSize: 11 }}>✓</span>;
}
