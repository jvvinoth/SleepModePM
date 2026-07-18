"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, Sun, Snowflake, Send, Check, MessageSquare, MapPin, Clock, Zap, Loader2, Database } from "lucide-react";
import { ORCH_URL, type Lead, type Temp } from "@/lib/types";

const TEMP: Record<Temp, { label: string; icon: typeof Flame; color: string; tint: string; text: string }> = {
  hot: { label: "Hot", icon: Flame, color: "#E24", tint: "var(--red-tint)", text: "var(--red-500)" },
  warm: { label: "Warm", icon: Sun, color: "var(--amber-500)", tint: "var(--amber-tint)", text: "var(--amber-text)" },
  cold: { label: "Cold", icon: Snowflake, color: "var(--brand-500)", tint: "var(--brand-tint)", text: "var(--brand-500)" },
};

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--surface-2)" }}>
        <div className="h-1.5 rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[12px] font-semibold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

function LeadCard({ lead, onAlert }: { lead: Lead; onAlert: (l: Lead) => void }) {
  const t = TEMP[lead.temperature];
  const [alerted, setAlerted] = useState(!!lead.alerted);
  return (
    <div className="card p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0" style={{ background: t.tint, color: t.text }}>{lead.initials}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold leading-tight truncate">{lead.name}</div>
          <div className="text-[12px] truncate" style={{ color: "var(--text-3)" }}>{lead.company}</div>
        </div>
        <span className="chip" style={{ background: t.tint, color: t.text }}>{lead.language}</span>
      </div>

      <ScoreBar score={lead.score} color={t.color} />

      <div className="flex gap-1.5 text-[12.5px]" style={{ color: "var(--text-2)" }}>
        <MessageSquare size={13} className="shrink-0 mt-0.5" style={{ color: t.text }} />
        <span className="line-clamp-2">{lead.question}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {lead.signals.slice(0, 3).map((s) => (
          <span key={s} className="chip" style={{ background: "var(--surface-2)", color: "var(--text-2)", fontSize: 11 }}><Zap size={9} /> {s}</span>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11.5px] pt-0.5" style={{ color: "var(--text-3)" }}>
        <span className="flex items-center gap-1"><MapPin size={11} /> {lead.source}</span>
        <span className="flex items-center gap-1"><Clock size={11} /> {lead.lastActive}</span>
      </div>

      {lead.temperature === "hot" && (
        alerted ? (
          <div className="flex items-center justify-center gap-1.5 text-[12.5px] font-medium py-2 rounded-lg" style={{ background: "var(--green-tint)", color: "var(--green-text)" }}>
            <Check size={14} /> Team alerted · Telegram + Slack
          </div>
        ) : (
          <button className="btn-primary flex items-center justify-center gap-1.5 w-full" style={{ background: t.color }} onClick={() => { onAlert(lead); setAlerted(true); }}>
            <Send size={14} /> Alert team now
          </button>
        )
      )}
    </div>
  );
}

export function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState<string>("empty");
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = () =>
      fetch(`${ORCH_URL}/api/leads`)
        .then((r) => r.json())
        .then((d) => {
          setLeads(d.leads ?? []);
          setStatus(d.status ?? "empty");
        })
        .catch(() => {});
    poll();
    timer.current = setInterval(poll, 3500); // keep polling while the agent generates
    return () => clearInterval(timer.current!);
  }, []);

  const generate = async () => {
    setStatus("generating");
    await fetch(`${ORCH_URL}/api/leads/generate`, { method: "POST" }).catch(() => {});
  };

  const alert = async (l: Lead) => {
    const res = await fetch(`${ORCH_URL}/api/leads/${l.id}/alert`, { method: "POST" }).then((r) => r.json()).catch(() => ({}));
    const ch = [res.telegram && "Telegram", res.slack && "Slack"].filter(Boolean);
    setToast(ch.length ? `🔥 ${l.name} sent to ${ch.join(" + ")}` : `Alert queued for ${l.name}`);
    setTimeout(() => setToast(null), 4000);
  };

  const cols: Temp[] = ["hot", "warm", "cold"];
  const count = (t: Temp) => leads.filter((l) => l.temperature === t).length;

  return (
    <>
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="flex items-center gap-2">
            <Flame size={20} style={{ color: "#E24" }} />
            <h1 className="text-[20px] font-semibold">Leads</h1>
          </div>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--text-2)" }}>
            Auto-scans after every knowledge-base crawl · or trigger a scan anytime.
          </p>
        </div>
        <button className="btn-primary flex items-center gap-1.5" style={{ background: "var(--purple-500)" }} onClick={generate} disabled={status === "generating"}>
          {status === "generating" ? <><Loader2 size={15} className="animate-spin" /> Scanning…</> : <><Zap size={15} /> Scan for leads</>}
        </button>
      </div>
      <div className="mb-5" />

      {leads.length === 0 && status !== "ready" ? (
        <div className="card flex flex-col items-center justify-center text-center py-20 px-6 gap-3">
          {status === "generating" ? (
            <>
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--purple-500)" }} />
              <div className="text-[15px] font-medium">Your agent is reading the knowledge base…</div>
              <div className="text-[13px]" style={{ color: "var(--text-2)" }}>Generating leads grounded in what you just crawled.</div>
            </>
          ) : (
            <>
              <Database size={28} style={{ color: "var(--text-3)" }} />
              <div className="text-[15px] font-medium">No leads yet</div>
              <div className="text-[13px] max-w-sm" style={{ color: "var(--text-2)" }}>
                Add a page to your <strong>Knowledge Base</strong>, then scan — the agent captures leads whose questions reference your content.
              </div>
              <button className="btn-primary flex items-center gap-1.5 mt-1" style={{ background: "var(--purple-500)" }} onClick={generate}><Zap size={15} /> Scan for leads now</button>
            </>
          )}
        </div>
      ) : (
      <>
      {/* stat row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {([["Total leads", leads.length, "var(--text-1)", null],
           ["Hot", count("hot"), "#E24", Flame],
           ["Warm", count("warm"), "var(--amber-500)", Sun],
           ["Cold", count("cold"), "var(--brand-500)", Snowflake]] as const).map(([label, val, color, Icon]) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-2)" }}>{Icon && <Icon size={13} style={{ color }} />} {label}</div>
            <div className="text-[24px] font-semibold mt-0.5" style={{ color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* pipeline */}
      <div className="grid lg:grid-cols-3 gap-4">
        {cols.map((t) => {
          const cfg = TEMP[t];
          return (
            <div key={t}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <cfg.icon size={16} style={{ color: cfg.color }} />
                <span className="text-[14px] font-semibold">{cfg.label}</span>
                <span className="chip" style={{ background: cfg.tint, color: cfg.text }}>{count(t)}</span>
              </div>
              <div className="space-y-3">
                {leads.filter((l) => l.temperature === t).map((l) => <LeadCard key={l.id} lead={l} onAlert={alert} />)}
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 card px-4 py-3 text-[13.5px] font-medium flex items-center gap-2 !shadow-xl" style={{ zIndex: 60 }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--green-500)" }} /> {toast}
        </div>
      )}
    </>
  );
}
