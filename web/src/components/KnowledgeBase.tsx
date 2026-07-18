"use client";

import { useEffect, useState } from "react";
import { Globe, Map, FileText, Type, Video, Plus, RefreshCw, Trash2, Check, ArrowLeft, Database, Loader2, Zap } from "lucide-react";
import { ORCH_URL, type KnowledgeBase } from "@/lib/types";

const SOURCES = [
  { icon: Globe, title: "Website", desc: "Recursively crawl a site and pick pages to include", on: true },
  { icon: Map, title: "Sitemap", desc: "Import pages listed in your sitemap.xml" },
  { icon: FileText, title: "Files", desc: "Upload PDF, DOCX, TXT, CSV or Markdown" },
  { icon: Type, title: "Text", desc: "Paste reference content like FAQs or product details" },
  { icon: Video, title: "YouTube", desc: "Import a video transcript into the knowledge base" },
];

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-4">
      <div className="text-[12px]" style={{ color: "var(--text-2)" }}>{label}</div>
      <div className="text-[24px] font-semibold mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

export function KnowledgeBaseView() {
  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState("Website");
  const [q, setQ] = useState("");
  const [url, setUrl] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${ORCH_URL}/api/knowledge`).then((r) => r.json()).then(setKb).catch(() => {});
  }, []);

  const crawl = async () => {
    if (!url || crawling) return;
    setCrawling(true);
    setToast(null);
    try {
      const r = await fetch(`${ORCH_URL}/api/knowledge/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }).then((x) => x.json());
      if (r.error) {
        setToast(`⚠️ ${r.error}`);
      } else {
        setKb((prev) =>
          prev
            ? { ...prev, total: prev.total + 1, trained: prev.trained + 1, documents: [r.doc, ...prev.documents] }
            : prev
        );
        setToast(`✅ Crawled via ${r.via === "oxylabs" ? "Oxylabs" : "direct fetch"} · ${r.doc.chunks} chunks · ${r.embedded} embedded (Doubleword)`);
        setUrl("");
      }
    } catch (e) {
      setToast(`⚠️ ${String(e)}`);
    } finally {
      setCrawling(false);
      setTimeout(() => setToast(null), 6000);
    }
  };

  if (adding) {
    return (
      <div className="max-w-4xl">
        <button className="flex items-center gap-1.5 text-[13px] mb-4" style={{ color: "var(--text-2)" }} onClick={() => setAdding(false)}>
          <ArrowLeft size={15} /> Back to Knowledge Base
        </button>
        <h1 className="text-[22px] font-semibold">Add content</h1>
        <p className="text-[13.5px] mt-1 mb-6" style={{ color: "var(--text-2)" }}>Bring your website or documents into the knowledge base.</p>

        <div className="flex items-center gap-3 mb-6 text-[13px]">
          {["Source", "Pages", "Review"].map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold" style={i === 0 ? { background: "var(--brand-500)", color: "#fff" } : { background: "var(--surface-2)", color: "var(--text-3)" }}>{i + 1}</span>
                <span style={{ color: i === 0 ? "var(--text-1)" : "var(--text-3)" }}>{s}</span>
              </span>
              {i < 2 && <span className="w-10 h-px" style={{ background: "var(--border-2)" }} />}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {SOURCES.map((s) => {
            const on = selected === s.title;
            return (
              <button key={s.title} onClick={() => s.on && setSelected(s.title)} disabled={!s.on}
                className="card p-5 text-left relative" style={on ? { borderColor: "var(--brand-500)", background: "var(--brand-tint)" } : !s.on ? { opacity: 0.55 } : {}}>
                {on && <Check size={18} className="absolute top-4 right-4" style={{ color: "var(--brand-500)" }} />}
                <s.icon size={22} style={{ color: "var(--brand-500)" }} strokeWidth={1.9} />
                <div className="text-[16px] font-semibold mt-3">{s.title}{!s.on && <span className="chip ml-2" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>soon</span>}</div>
                <p className="text-[13px] mt-1" style={{ color: "var(--text-2)" }}>{s.desc}</p>
              </button>
            );
          })}
        </div>
        <div className="mt-6"><button className="btn-primary" onClick={() => setAdding(false)}>Continue</button></div>
      </div>
    );
  }

  const docs = (kb?.documents ?? []).filter((d) => d.path.includes(q) || d.url.includes(q));

  return (
    <>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-[20px] font-semibold flex items-center gap-2"><Database size={19} style={{ color: "var(--purple-500)" }} /> Knowledge Base</h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--text-2)" }}>Crawl &amp; index your content — this trains the AI agent that captures leads.</p>
        </div>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setAdding(true)}><Plus size={15} strokeWidth={2.4} /> Add content</button>
      </div>

      {/* Add a URL — REAL crawl via Oxylabs → chunk → embed via Doubleword */}
      <div className="card p-5 my-5">
        <div className="text-[14px] font-semibold mb-2.5">Add a URL <span className="font-normal" style={{ color: "var(--text-3)" }}>· crawled live through Oxylabs, embedded by Doubleword</span></div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg px-3 text-[14px]"
            style={{ height: 40, border: "1px solid var(--border)" }}
            placeholder="https://yoursite.com/page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && crawl()}
            disabled={crawling}
          />
          <button className="btn-primary flex items-center gap-1.5" onClick={crawl} disabled={crawling}>
            {crawling ? <><Loader2 size={15} className="animate-spin" /> Crawling…</> : <><Zap size={15} /> Crawl &amp; index</>}
          </button>
        </div>
        {toast && (
          <div className="text-[13px] mt-2.5" style={{ color: toast.startsWith("⚠️") ? "var(--red-500)" : "var(--green-text)" }}>{toast}</div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 my-5">
        <Stat label="Total" value={kb?.total ?? 0} color="var(--brand-500)" />
        <Stat label="Trained" value={kb?.trained ?? 0} color="var(--green-500)" />
        <Stat label="Pending" value={kb?.pending ?? 0} color="var(--amber-500)" />
        <Stat label="Failed" value={kb?.failed ?? 0} color="var(--red-500)" />
      </div>

      <div className="card p-0">
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-[15px] font-semibold">Documents <span style={{ color: "var(--text-3)" }}>· {kb?.site}</span></span>
          <div className="flex items-center gap-2">
            <input className="rounded-lg px-3 text-[13px]" style={{ height: 34, width: 200, border: "1px solid var(--border)" }} placeholder="Search URL…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn-ghost flex items-center gap-1.5 text-[13px]"><RefreshCw size={13} /> Resync all</button>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {docs.map((d) => (
            <div key={d.url} className="flex items-center justify-between px-5 py-3.5" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className="text-[14px] font-medium">{d.path}</div>
                <a href={d.url} target="_blank" className="text-[12px]" style={{ color: "var(--text-3)" }}>{d.url}</a>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[12.5px]" style={{ color: "var(--text-3)" }}>{d.chunks} chunks</span>
                <span className="chip" style={{ background: "var(--green-tint)", color: "var(--green-text)" }}>Trained</span>
                <RefreshCw size={15} style={{ color: "var(--text-3)" }} />
                <Trash2 size={15} style={{ color: "var(--text-3)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
