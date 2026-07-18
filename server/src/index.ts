/** SleepMode PM orchestrator — API for the web console. */
import express from "express";
import { config } from "./config.js";
import { ideate } from "./ideator.js";
import { createJob, getJob, serializeJob } from "./jobs.js";
import { runBuildJob, promoteJob } from "./builder.js";
import { loadSnapshot, saveSnapshot } from "./snapshot.js";
import { cachedSignals, fetchPageText } from "./signals.js";
import { embed } from "./llm.js";
import { notify, sendSlack, channelStatus } from "./telegram.js";
import { knowledgeBase, addCrawledDoc, regenerateLeads, leadsState, getLead } from "./business.js";
import type { IdeationResult } from "./types.js";

// Never let a stray rejection take the orchestrator down (Railway = crash loop otherwise).
process.on("unhandledRejection", (e) => console.error("[unhandledRejection]", e));
process.on("uncaughtException", (e) => console.error("[uncaughtException]", e));

const app = express();
app.use(express.json());

// permissive CORS for the hackathon (console on Cloudflare Pages / localhost)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true, service: "sleepmode-orchestrator" }));

/** Ideation — served from a persisted snapshot instantly, refreshed in the background. */
let cache: IdeationResult | null = loadSnapshot();
let inflight: Promise<IdeationResult> | null = null;

function refresh(): Promise<IdeationResult> {
  inflight ??= ideate()
    .then((r) => {
      cache = r;
      saveSnapshot(r);
      return r;
    })
    .finally(() => (inflight = null));
  return inflight;
}

app.get("/api/ideas", async (req, res) => {
  try {
    // Instant path: serve the snapshot; kick a background refresh if it's the default.
    if (cache && req.query.refresh !== "1") {
      if (!inflight) void refresh().catch(() => {});
      return res.json(cache);
    }
    // Cold path (no snapshot yet, or forced refresh): wait for generation.
    res.json(await refresh());
  } catch (err) {
    console.error("[/api/ideas]", err);
    if (cache) return res.json(cache);
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Live market signals — the Business persona's feed (competitors + CVEs). */
app.get("/api/signals", (_req, res) => {
  res.json(cachedSignals() ?? { competitors: [], cves: [], fetchedAt: null });
});

/** Knowledge base — the company's indexed content that powers the AI agent. */
app.get("/api/knowledge", (_req, res) => res.json(knowledgeBase));

/** REAL crawl+index: Oxylabs fetches the page → chunk → Doubleword embeds → trained doc. */
app.post("/api/knowledge/crawl", async (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url || !/^https?:\/\//.test(url)) return res.status(400).json({ error: "valid http(s) url required" });
  try {
    const { text, via } = await fetchPageText(url);
    if (text.length < 40) throw new Error("no readable content at that URL");

    // chunk (~800 chars) and vectorize via Doubleword (bounded so it stays snappy live)
    const chunks: string[] = [];
    for (let i = 0; i < text.length && chunks.length < 24; i += 800) chunks.push(text.slice(i, i + 800));
    let embedded = 0;
    try {
      const vecs = await embed(chunks.slice(0, 8));
      embedded = vecs.length;
    } catch (e) {
      console.warn("[crawl] embed skipped:", (e as Error).message);
    }

    const u = (() => { try { return new URL(url); } catch { return null; } })();
    const doc = { path: u?.pathname || "/", url, chunks: chunks.length, status: "trained" as const };
    addCrawledDoc(doc, text, u?.hostname ?? "");

    // regenerate leads grounded in the new knowledge (background — Leads view polls)
    void regenerateLeads();

    res.json({ doc, via, embedded, snippet: text.slice(0, 220) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Leads captured by the agent, scored Hot / Warm / Cold (generated from the knowledge base). */
app.get("/api/leads", (_req, res) => res.json(leadsState()));

/** Manual trigger — re-scan the knowledge base for leads on demand. */
app.post("/api/leads/generate", (_req, res) => {
  void regenerateLeads();
  res.json({ status: "generating" });
});

/** Notification channels + status (Telegram/Slack enabled, others coming soon). */
app.get("/api/channels", (_req, res) => res.json({ channels: channelStatus() }));

/** Alert the team about a hot lead — fires Telegram + Slack. */
app.post("/api/leads/:id/alert", async (req, res) => {
  const lead = getLead(req.params.id);
  if (!lead) return res.status(404).json({ error: "unknown lead" });
  const msg =
    `🔥 *Hot lead* — ${lead.name} (${lead.company})\n` +
    `Intent score: *${lead.score}/100*\n` +
    `"${lead.question}"\n` +
    `Signals: ${lead.signals.join(", ")}\n` +
    `Source: ${lead.source} · ${lead.language}`;
  const [tg, sl] = await Promise.all([notify(msg), sendSlack(msg)]);
  lead.alerted = true;
  res.json({ telegram: tg, slack: sl });
});

/** Approve a card → kick off the build pipeline → returns jobId immediately. */
app.post("/api/approve", (req, res) => {
  const { cardId } = req.body as { cardId?: string };
  const card = cache?.cards.find((c) => c.id === cardId);
  if (!card) return res.status(404).json({ error: `unknown card: ${cardId}` });

  const job = createJob(card.id);
  card.status = "building";
  void notify(`🌙 *SleepMode PM* is building:\n*${card.title}*\nI'll ping you when the preview is ready.`);
  void runBuildJob(job, card).then(() => {
    card.status = job.status === "ready" ? "ready" : "failed";
    card.previewUrl = job.previewUrl;
    card.sandboxId = job.sandboxId;
    if (job.status === "ready") {
      void notify(
        `✅ *Preview ready* — ${card.title}\n${job.summary ?? ""}\n\n👀 Review: ${job.previewUrl}\n\nApprove to open a PR in the console.`
      );
    } else {
      void notify(`⚠️ Build failed for *${card.title}*. Check the console.`);
    }
  });
  res.json({ jobId: job.id });
});

/** Poll a build job — the console's activity timeline reads this. */
app.get("/api/jobs/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "unknown job" });
  res.json(serializeJob(job));
});

/** Promote a ready job: commit in sandbox → push branch → open PR. */
app.post("/api/promote", async (req, res) => {
  const { jobId } = req.body as { jobId?: string };
  const job = jobId && getJob(jobId);
  if (!job) return res.status(404).json({ error: "unknown job" });
  try {
    res.json(await promoteJob(job));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(config.port, () => {
  console.log(
    `orchestrator listening on :${config.port}` +
      (cache ? ` (snapshot loaded: ${cache.cards.length} cards)` : " (no snapshot)")
  );
  // Refresh the snapshot in the background — never blocks health or first request.
  setTimeout(() => void refresh().catch((e) => console.warn("[warmup]", (e as Error).message)), 500);
});
