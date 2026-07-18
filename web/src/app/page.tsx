"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Sidebar, TopBar } from "@/components/Shell";
import { ConnectModal } from "@/components/ConnectModal";
import { BuildPanel } from "@/components/BuildPanel";
import { KnowledgeBaseView } from "@/components/KnowledgeBase";
import { LeadsView } from "@/components/Leads";
import { DashboardView, CodebaseView, ActivityView, SettingsView } from "@/components/Views";
import { ORCH_URL, type Channel, type IdeaCard, type IdeationResult, type View } from "@/lib/types";

export default function App() {
  const [data, setData] = useState<IdeationResult | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [active, setActive] = useState<{ jobId: string; card: IdeaCard } | null>(null);
  const [jobs, setJobs] = useState<{ title: string; status: string; url?: string }[]>([]);
  const [showConnect, setShowConnect] = useState(false);

  useEffect(() => {
    fetch(`${ORCH_URL}/api/ideas`).then((r) => r.json()).then((d) => (d.error ? setError(d.error) : setData(d))).catch((e) => setError(String(e)));
    fetch(`${ORCH_URL}/api/channels`).then((r) => r.json()).then((d) => setChannels(d.channels ?? [])).catch(() => {});
  }, []);

  const approve = async (card: IdeaCard) => {
    const res = await fetch(`${ORCH_URL}/api/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id }),
    });
    const d = await res.json();
    if (d.jobId) {
      setActive({ jobId: d.jobId, card });
      setJobs((j) => [{ title: card.title, status: "running" }, ...j]);
    }
  };

  const buildPanel = active ? <BuildPanel jobId={active.jobId} card={active.card} onClose={() => setActive(null)} /> : null;
  const needsData = view === "dashboard" || view === "codebase";

  return (
    <div>
      <Sidebar active={view} onNavigate={setView} />
      <TopBar repo={data?.repo.repo} live={!!data} onConnect={() => setShowConnect(true)} />
      {showConnect && <ConnectModal onClose={() => setShowConnect(false)} />}

      <main className="ml-60 pt-14">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {needsData && !data && !error && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-500)" }} />
              <div className="text-[14px]" style={{ color: "var(--text-2)" }}>Loading your overnight run…</div>
            </div>
          )}
          {needsData && error && (
            <div className="card p-6 text-[14px]" style={{ color: "var(--red-500)" }}>Orchestrator error: {error}</div>
          )}

          {view === "knowledge" && <KnowledgeBaseView />}
          {view === "leads" && <LeadsView />}
          {view === "activity" && <ActivityView jobs={jobs} />}
          {view === "settings" && <SettingsView repo={data?.repo.repo} channels={channels} />}
          {view === "dashboard" && data && <DashboardView data={data} onNavigate={setView} />}
          {view === "codebase" && data && <CodebaseView data={data} onBuild={approve} buildPanel={buildPanel} />}
        </div>
      </main>
    </div>
  );
}
