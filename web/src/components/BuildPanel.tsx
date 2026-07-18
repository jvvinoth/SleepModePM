"use client";

import { useEffect, useRef, useState } from "react";
import type { BuildJob, IdeaCard } from "@/lib/types";
import { ORCH_URL } from "@/lib/types";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  GitPullRequest,
  Box,
  X,
} from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  "plan:generate": "AI& is writing the implementation",
  "plan:ready": "Implementation plan ready",
  "sandbox:create": "Spinning up Daytona sandbox",
  "sandbox:ready": "Sandbox ready (~100ms boot)",
  "repo:clone": "Cloning repository",
  "files:apply": "Applying generated changes",
  "deps:install": "Installing dependencies",
  "env:write": "Writing environment",
  "server:start": "Booting dev server",
  "server:poll": "Waiting for the app to answer",
  "server:up": "App is up",
  "preview:ready": "Preview live 🎉",
  "critic:repair": "Critic caught a failure — Builder repairing",
  "promote:commit": "Committing to branch",
  "promote:pr": "Opening pull request",
  "promote:done": "Pull request open",
  "job:failed": "Build failed",
};

export function BuildPanel({
  jobId,
  card,
  onClose,
}: {
  jobId: string;
  card: IdeaCard;
  onClose: () => void;
}) {
  const [job, setJob] = useState<BuildJob | null>(null);
  const [promoting, setPromoting] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = () =>
      fetch(`${ORCH_URL}/api/jobs/${jobId}`)
        .then((r) => r.json())
        .then(setJob)
        .catch(() => {});
    poll();
    timer.current = setInterval(poll, 2000);
    return () => clearInterval(timer.current!);
  }, [jobId]);

  const done = job?.status === "ready" || job?.status === "promoted";
  const failed = job?.status === "failed";

  const promote = async () => {
    setPromoting(true);
    await fetch(`${ORCH_URL}/api/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    }).catch(() => {});
    setPromoting(false);
  };

  return (
    <div className="card p-0 mb-6 overflow-hidden">
      {/* header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <div className="flex items-center gap-2.5">
          {done ? (
            <CheckCircle2 size={18} style={{ color: "var(--green-500)" }} />
          ) : failed ? (
            <XCircle size={18} style={{ color: "var(--red-500)" }} />
          ) : (
            <Loader2 size={18} className="animate-spin" style={{ color: "var(--brand-500)" }} />
          )}
          <span className="text-[14px] font-semibold">{card.title}</span>
          {job?.sandboxId && (
            <span className="chip" style={{ background: "var(--brand-tint)", color: "var(--brand-500)" }}>
              <Box size={12} /> {job.sandboxId.slice(0, 8)}
            </span>
          )}
        </div>
        <button className="btn-ghost !p-1.5" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="grid md:grid-cols-2">
        {/* timeline */}
        <div className="p-5" style={{ borderRight: "1px solid var(--border)" }}>
          <div className="space-y-2.5">
            {job?.events.map((e, i) => {
              const last = i === job.events.length - 1;
              const isErr = e.step === "job:failed" || e.step === "critic:repair";
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <span
                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${last && !done && !failed ? "pulse" : ""}`}
                    style={{
                      background: isErr
                        ? e.step === "critic:repair" ? "var(--amber-500)" : "var(--red-500)"
                        : last && !done && !failed
                          ? "var(--brand-500)"
                          : "var(--green-500)",
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium leading-tight">
                      {STEP_LABELS[e.step] ?? e.step}
                    </div>
                    {e.detail && (
                      <div className="text-[11.5px] font-mono truncate" style={{ color: "var(--text-3)" }}>
                        {e.detail}
                      </div>
                    )}
                  </div>
                  <span className="ml-auto text-[11px] font-mono shrink-0" style={{ color: "var(--text-3)" }}>
                    {new Date(e.t).toLocaleTimeString([], { hour12: false })}
                  </span>
                </div>
              );
            }) ?? (
              <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
                Starting…
              </div>
            )}
          </div>
          {failed && job?.error && (
            <div
              className="mt-4 text-[12px] font-mono rounded-md p-3 whitespace-pre-wrap"
              style={{ background: "var(--red-tint)", color: "var(--red-500)" }}
            >
              {job.error.slice(0, 400)}
            </div>
          )}
        </div>

        {/* preview */}
        <div className="p-5">
          {done && job?.previewUrl ? (
            <>
              {/* browser-chrome mock */}
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-2)" }}>
                <div
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
                >
                  <span className="flex gap-1.5">
                    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                      <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    ))}
                  </span>
                  <span
                    className="flex-1 text-[11.5px] font-mono truncate rounded px-2 py-1"
                    style={{ background: "var(--surface)", color: "var(--text-2)" }}
                  >
                    {job.previewUrl}
                  </span>
                </div>
                <iframe src={job.previewUrl} className="w-full h-72 bg-white" title="preview" />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <a href={job.previewUrl} target="_blank" className="btn-primary flex items-center gap-1.5">
                  <ExternalLink size={14} /> Open preview
                </a>
                {job.status === "promoted" && job.prUrl ? (
                  <a
                    href={job.prUrl}
                    target="_blank"
                    className="btn-primary flex items-center gap-1.5"
                    style={{ background: "var(--green-500)" }}
                  >
                    <GitPullRequest size={14} /> View PR
                  </a>
                ) : (
                  <button
                    className="btn-primary flex items-center gap-1.5"
                    style={{ background: "var(--green-500)" }}
                    onClick={promote}
                    disabled={promoting}
                  >
                    {promoting ? <Loader2 size={14} className="animate-spin" /> : <GitPullRequest size={14} />}
                    Approve to Dev branch
                  </button>
                )}
              </div>
              {job.changedFiles && (
                <div className="mt-3 text-[11.5px] font-mono" style={{ color: "var(--text-3)" }}>
                  changed: {job.changedFiles.join(" · ")}
                </div>
              )}
            </>
          ) : (
            <div
              className="h-full min-h-48 rounded-lg flex flex-col items-center justify-center gap-2"
              style={{ background: "var(--surface-2)", border: "1px dashed var(--border-2)" }}
            >
              {failed ? (
                <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                  No preview — build failed
                </span>
              ) : (
                <>
                  <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-3)" }} />
                  <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                    Preview will appear here
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
