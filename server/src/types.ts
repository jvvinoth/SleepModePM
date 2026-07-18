/** The shared contract between orchestrator and web console. */

export type Track = "level_up" | "whats_next";
export type Impact = "high" | "medium" | "low";
export type Effort = "S" | "M" | "L";
export type Risk = "low" | "medium" | "high";
export type CardStatus =
  | "proposed"
  | "approved"
  | "building"
  | "testing"
  | "ready"
  | "failed";

export interface Signal {
  source: string; // e.g. "GitHub Advisory", "competitor site", "Product Hunt"
  summary: string;
  url?: string;
  date?: string;
}

export interface IdeaCard {
  id: string;
  track: Track;
  title: string;
  rationale: string; // one crisp line — why this matters now
  bullets: string[]; // 2–3 short scannable points
  category: string; // security | feature | ux | growth | perf | tests
  impact: Impact;
  effort: Effort;
  risk: Risk;
  targetFiles: string[];
  signal?: Signal;
  status: CardStatus;
  previewUrl?: string;
  sandboxId?: string;
}

export interface RepoSummary {
  repo: string;
  description: string; // LLM's one-paragraph understanding of the product
  framework: string;
  fileCount: number;
  keyAreas: string[];
}

export interface IdeationResult {
  repo: RepoSummary;
  cards: IdeaCard[];
  generatedAt: string;
}
