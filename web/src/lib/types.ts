/* Mirror of server/src/types.ts — the API contract. */
export type Track = "level_up" | "whats_next";

export interface Signal {
  source: string;
  summary: string;
  url?: string;
  date?: string;
}

export interface IdeaCard {
  id: string;
  track: Track;
  title: string;
  rationale: string;
  bullets: string[];
  category: string;
  impact: "high" | "medium" | "low";
  effort: "S" | "M" | "L";
  risk: "low" | "medium" | "high";
  targetFiles: string[];
  signal?: Signal;
  status: "proposed" | "approved" | "building" | "testing" | "ready" | "failed";
  previewUrl?: string;
  sandboxId?: string;
}

export interface RepoSummary {
  repo: string;
  description: string;
  framework: string;
  fileCount: number;
  keyAreas: string[];
}

export interface IdeationResult {
  repo: RepoSummary;
  cards: IdeaCard[];
  generatedAt: string;
}

export interface JobEvent {
  t: string;
  step: string;
  detail?: string;
}

export interface BuildJob {
  id: string;
  cardId: string;
  status: "running" | "ready" | "failed" | "promoted";
  events: JobEvent[];
  previewUrl?: string;
  sandboxId?: string;
  summary?: string;
  changedFiles?: string[];
  branch?: string;
  prUrl?: string;
  error?: string;
}

// Prod default = Railway orchestrator. Local dev overrides via web/.env.local.
// NB: use || not ?? — CI injects an EMPTY string when the GH var is unset.
export const ORCH_URL =
  (process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "").trim() ||
  "https://sleepmodepm-production.up.railway.app";
