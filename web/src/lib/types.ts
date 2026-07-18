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
export interface CompetitorSignal {
  name: string;
  source: string;
  summary: string;
  url?: string;
  date?: string;
  text?: string;
}
export interface CveSignal {
  id: string;
  package: string;
  source: string;
  summary: string;
  url?: string;
  severity?: string;
  date?: string;
}
export interface SignalBundle {
  competitors: CompetitorSignal[];
  cves: CveSignal[];
  fetchedAt: string | null;
}

export interface KnowledgeDoc {
  path: string;
  url: string;
  chunks: number;
  status: "trained" | "pending" | "failed";
}
export interface KnowledgeBase {
  total: number;
  trained: number;
  pending: number;
  failed: number;
  site: string;
  documents: KnowledgeDoc[];
}

export type Temp = "hot" | "warm" | "cold";
export interface Lead {
  id: string;
  name: string;
  company: string;
  initials: string;
  score: number;
  temperature: Temp;
  intent: string;
  signals: string[];
  question: string;
  source: string;
  language: string;
  lastActive: string;
  alerted?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  enabled: boolean;
  status: "connected" | "available" | "coming_soon";
}

export type View = "dashboard" | "knowledge" | "leads" | "codebase" | "activity" | "settings";

export const ORCH_URL =
  (process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "").trim() ||
  "https://sleepmodepm-production.up.railway.app";
