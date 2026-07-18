/** SleepMode PM orchestrator — API for the web console. */
import express from "express";
import { config } from "./config.js";
import { ideate } from "./ideator.js";
import { createJob, getJob, serializeJob } from "./jobs.js";
import { runBuildJob, promoteJob } from "./builder.js";
import { loadSnapshot, saveSnapshot } from "./snapshot.js";
import { cachedSignals } from "./signals.js";
import { notify } from "./telegram.js";
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
