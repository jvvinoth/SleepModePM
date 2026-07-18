/** SleepMode PM orchestrator — API for the web console. */
import express from "express";
import { config } from "./config.js";
import { ideate } from "./ideator.js";
import { createJob, getJob, serializeJob } from "./jobs.js";
import { runBuildJob, promoteJob } from "./builder.js";
import type { IdeationResult } from "./types.js";

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

/** Ideation — cached in memory after first run ("it ran overnight"). ?refresh=1 regenerates. */
let cache: IdeationResult | null = null;
let inflight: Promise<IdeationResult> | null = null;

app.get("/api/ideas", async (req, res) => {
  try {
    if (req.query.refresh === "1") cache = null;
    if (!cache) {
      inflight ??= ideate().finally(() => (inflight = null));
      cache = await inflight;
    }
    res.json(cache);
  } catch (err) {
    console.error("[/api/ideas]", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Approve a card → kick off the build pipeline → returns jobId immediately. */
app.post("/api/approve", (req, res) => {
  const { cardId } = req.body as { cardId?: string };
  const card = cache?.cards.find((c) => c.id === cardId);
  if (!card) return res.status(404).json({ error: `unknown card: ${cardId}` });

  const job = createJob(card.id);
  card.status = "building";
  void runBuildJob(job, card).then(() => {
    card.status = job.status === "ready" ? "ready" : "failed";
    card.previewUrl = job.previewUrl;
    card.sandboxId = job.sandboxId;
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
  console.log(`orchestrator listening on :${config.port}`);
});
