/** SleepMode PM orchestrator — API for the web console. */
import express from "express";
import { config } from "./config.js";
import { ideate } from "./ideator.js";
import type { IdeationResult } from "./types.js";

const app = express();
app.use(express.json());

// permissive CORS for the hackathon (console on Cloudflare Pages / localhost)
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  next();
});
app.options("*path", (_req, res) => res.sendStatus(204));

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

app.listen(config.port, () => {
  console.log(`orchestrator listening on :${config.port}`);
});
