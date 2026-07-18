/**
 * Ideator agent — turns Scout's repo context into the two-track decision cards.
 * 🔧 level_up: improve what exists (security, UX, perf, tests)
 * 🚀 whats_next: net-new features grounded in the product's market
 */
import { chat, extractJson } from "./llm.js";
import { scoutRepo, renderContext } from "./scout.js";
import type { IdeaCard, IdeationResult, RepoSummary } from "./types.js";

const SYSTEM = `You are SleepMode PM — an autonomous AI product manager. You study a codebase
and its market, then propose the next best product moves as short, decisive cards a busy
founder can approve with one tap. Be concrete and repo-specific: reference real files, real
gaps, real opportunities. Never generic advice.`;

const PROMPT = (ctx: string) => `${ctx}

TASK: Propose exactly 6 idea cards for this product — 3 per track:

Track "level_up" (improve what exists): security hardening, UX gaps, performance, missing
tests — grounded in the ACTUAL code above (cite real files in targetFiles).

Track "whats_next" (net-new): features this product should add next, considering what
competing products in its space ship (AI support-agent / SaaS market). At least one card
should be a small, visually demoable UI feature (a new page or section).

Rules:
- title: ≤8 words, imperative ("Add rate limiting to contact API")
- rationale: ONE line — why now
- bullets: 2–3 points, ≤12 words each
- category: security | feature | ux | growth | perf | tests
- impact high|medium|low · effort S|M|L · risk low|medium|high
- targetFiles: real paths from the tree (for whats_next, where new code would live)
- Make at least one level_up card category "security".

Also write repoSummary: description (2 sentences, what this product IS), framework,
keyAreas (3-5 short strings).

Return ONLY JSON:
{"repoSummary": {"description": "...", "framework": "...", "keyAreas": ["..."]},
 "cards": [{"track":"level_up","title":"...","rationale":"...","bullets":["..."],
 "category":"...","impact":"...","effort":"...","risk":"...","targetFiles":["..."]}]}`;

export async function ideate(repo?: string): Promise<IdeationResult> {
  const ctx = await scoutRepo(repo);
  const raw = await chat(PROMPT(renderContext(ctx)), { system: SYSTEM, maxTokens: 6000 });
  const parsed = extractJson<{
    repoSummary: { description: string; framework: string; keyAreas: string[] };
    cards: Omit<IdeaCard, "id" | "status">[];
  }>(raw);

  const cards: IdeaCard[] = parsed.cards.map((c, i) => ({
    ...c,
    id: `card-${i + 1}`,
    status: "proposed",
  }));

  const repoSummary: RepoSummary = {
    repo: ctx.repo,
    description: parsed.repoSummary.description,
    framework: parsed.repoSummary.framework,
    fileCount: ctx.tree.length,
    keyAreas: parsed.repoSummary.keyAreas,
  };

  return { repo: repoSummary, cards, generatedAt: new Date().toISOString() };
}
