"use client";

import { useEffect, useState } from "react";
import { Wrench, Rocket, Files, Loader2, Moon } from "lucide-react";
import { Sidebar, TopBar } from "@/components/Shell";
import { IdeaCardView } from "@/components/IdeaCardView";
import { BuildPanel } from "@/components/BuildPanel";
import { ORCH_URL, type IdeaCard, type IdeationResult, type Track } from "@/lib/types";

export default function Dashboard() {
  const [data, setData] = useState<IdeationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Track>("level_up");
  const [active, setActive] = useState<{ jobId: string; card: IdeaCard } | null>(null);

  useEffect(() => {
    fetch(`${ORCH_URL}/api/ideas`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setData(d)))
      .catch((e) => setError(String(e)));
  }, []);

  const approve = async (card: IdeaCard) => {
    const res = await fetch(`${ORCH_URL}/api/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id }),
    });
    const d = await res.json();
    if (d.jobId) setActive({ jobId: d.jobId, card });
  };

  const cards = data?.cards.filter((c) => c.track === tab) ?? [];

  return (
    <div>
      <Sidebar />
      <TopBar repo={data?.repo.repo} live={!!data} />

      <main className="ml-60 pt-14">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {!data && !error && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-500)" }} />
              <div className="text-[14px]" style={{ color: "var(--text-2)" }}>
                Scout is reading your repo… Ideator is thinking…
              </div>
              <div className="text-[12px]" style={{ color: "var(--text-3)" }}>
                (first run takes ~1 min — it usually happens while you sleep)
              </div>
            </div>
          )}

          {error && (
            <div className="card p-6 text-[14px]" style={{ color: "var(--red-500)" }}>
              Orchestrator error: {error} — is server/ running on :8080?
            </div>
          )}

          {data && (
            <>
              {/* Repo health header */}
              <div className="card p-5 mb-6 flex items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-[20px] font-semibold">{data.repo.repo}</h1>
                    <span className="chip" style={{ background: "var(--brand-tint)", color: "var(--brand-500)" }}>
                      {data.repo.framework}
                    </span>
                    <span className="chip" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                      <Files size={12} /> {data.repo.fileCount} files
                    </span>
                  </div>
                  <p className="text-[13.5px] mt-2 max-w-2xl" style={{ color: "var(--text-2)" }}>
                    {data.repo.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {data.repo.keyAreas.map((a) => (
                      <span key={a} className="chip" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 text-[12px] justify-end" style={{ color: "var(--text-3)" }}>
                    <Moon size={13} /> ideated overnight
                  </div>
                  <div className="text-[12px] mt-1 font-mono" style={{ color: "var(--text-3)" }}>
                    {new Date(data.generatedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-5" style={{ borderBottom: "1px solid var(--border)" }}>
                {(
                  [
                    { key: "level_up", label: "Level Up", icon: Wrench, accent: "var(--brand-500)", hint: "improve what you have" },
                    { key: "whats_next", label: "What's Next", icon: Rocket, accent: "var(--purple-500)", hint: "add new things" },
                  ] as const
                ).map(({ key, label, icon: Icon, accent, hint }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className="flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium -mb-px"
                    style={
                      tab === key
                        ? { color: "var(--text-1)", borderBottom: `2px solid ${accent}` }
                        : { color: "var(--text-2)", borderBottom: "2px solid transparent" }
                    }
                  >
                    <Icon size={16} strokeWidth={1.9} style={{ color: tab === key ? accent : undefined }} />
                    {label}
                    <span className="text-[12px] font-normal hidden sm:inline" style={{ color: "var(--text-3)" }}>
                      · {hint}
                    </span>
                  </button>
                ))}
              </div>

              {/* Live build panel */}
              {active && (
                <BuildPanel jobId={active.jobId} card={active.card} onClose={() => setActive(null)} />
              )}

              {/* Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <IdeaCardView key={card.id} card={card} onBuild={approve} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
