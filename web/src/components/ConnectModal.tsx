"use client";

import { useState } from "react";
import { X, Globe, FolderGit2, Check, Loader2, Radar, Code2 } from "lucide-react";

export function ConnectModal({ onClose }: { onClose: () => void }) {
  const [site, setSite] = useState("");
  const [indexing, setIndexing] = useState(false);
  const [indexed, setIndexed] = useState(false);

  const indexSite = () => {
    if (!site) return;
    setIndexing(true);
    // MVP: onboarding is scripted — the demo repo is already connected.
    setTimeout(() => {
      setIndexing(false);
      setIndexed(true);
    }, 1600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.35)" }}
      onClick={onClose}
    >
      <div
        className="card !shadow-xl w-full max-w-lg p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-[15px] font-semibold">Connect your company</span>
          <button className="btn-ghost !p-1.5" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Business persona */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Radar size={15} style={{ color: "var(--purple-500)" }} />
              <span className="text-[13px] font-semibold">Business team — market intelligence</span>
            </div>
            <p className="text-[12.5px] mb-2.5" style={{ color: "var(--text-2)" }}>
              Add your website &amp; docs. We index them and watch competitors — you get signals and new-product ideas.
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg px-3 text-[14px]"
                style={{ height: 40, border: "1px solid var(--border)", background: "var(--surface)" }}
                placeholder="yourcompany.com"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                disabled={indexed}
              />
              <button className="btn-primary" style={{ background: "var(--purple-500)" }} onClick={indexSite} disabled={indexing || indexed}>
                {indexing ? <Loader2 size={15} className="animate-spin" /> : indexed ? <Check size={15} /> : "Index"}
              </button>
            </div>
            {indexed && (
              <div className="text-[12px] mt-2 flex items-center gap-1.5" style={{ color: "var(--green-text)" }}>
                <Check size={13} /> Indexed 47 pages · competitor watch active via Oxylabs
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--border)" }} />

          {/* Engineering persona */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Code2 size={15} style={{ color: "var(--brand-500)" }} />
              <span className="text-[13px] font-semibold">Engineering team — codebase</span>
            </div>
            <p className="text-[12.5px] mb-2.5" style={{ color: "var(--text-2)" }}>
              Connect a GitHub repo. We read the code and propose fixes &amp; features — built &amp; previewed in a sandbox.
            </p>
            <div
              className="flex items-center justify-between rounded-lg px-3.5 py-3"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2.5">
                <FolderGit2 size={17} />
                <div>
                  <div className="text-[13.5px] font-medium">jvvinoth/mongpt-marketing</div>
                  <div className="text-[11.5px]" style={{ color: "var(--text-3)" }}>Next.js · 129 files</div>
                </div>
              </div>
              <span className="chip" style={{ background: "var(--green-tint)", color: "var(--green-text)" }}>
                <Check size={12} /> connected
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 flex justify-end" style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
