/**
 * Signals agent — the outside-world intelligence that makes SleepMode PM a product
 * strategist, not a coding agent.
 *
 * 1. Competitor intel: scrapes competitor sites THROUGH the Oxylabs residential proxy
 *    (clean IPs, no blocks). Graceful: if the proxy is unreachable (some venue networks
 *    kill CONNECT tunnels), signals are simply omitted.
 * 2. Security advisories: real CVE data for the repo's dependencies from OSV.dev.
 */
import https from "node:https";
import { HttpsProxyAgent } from "https-proxy-agent";
import { config } from "./config.js";
import type { Signal } from "./types.js";

// Competitors of the demo product (MonGPT = AI support-agent for Asian markets)
const COMPETITORS = [
  { name: "Intercom", url: "https://www.intercom.com" },
  { name: "Tidio", url: "https://www.tidio.com" },
  { name: "Crisp", url: "https://crisp.chat/en/" },
];

function oxylabsAgent(): HttpsProxyAgent<string> | null {
  const { proxyHost, proxyPort, proxyUser, pass } = config.oxylabs;
  if (!proxyUser || !pass) return null;
  const u = encodeURIComponent(proxyUser);
  const p = encodeURIComponent(pass);
  return new HttpsProxyAgent(`http://${u}:${p}@${proxyHost}:${proxyPort}`);
}

/** GET a URL through an https agent (Oxylabs proxy). Native https — no undici. */
function getThroughProxy(url: string, agent: HttpsProxyAgent<string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { agent, timeout: 20000, headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" } },
      (res) => {
        if ((res.statusCode ?? 500) >= 400) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => {
          data += c;
          if (data.length > 400_000) res.destroy(); // cap
        });
        res.on("end", () => resolve(data));
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fetch a page's text — through Oxylabs proxy if available, else direct. Used by the crawler. */
export async function fetchPageText(url: string): Promise<{ text: string; via: "oxylabs" | "direct" }> {
  const agent = oxylabsAgent();
  if (agent) {
    try {
      const html = await getThroughProxy(url, agent);
      return { text: stripHtml(html), via: "oxylabs" };
    } catch {
      /* proxy blocked (e.g. venue wifi) — fall back to direct */
    }
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return { text: stripHtml(await res.text()), via: "direct" };
}

export interface CompetitorSignal extends Signal {
  name: string;
  text: string; // extracted page text for the Ideator
}

/** Scrape competitor homepages through Oxylabs. Failures are skipped silently. */
export async function fetchCompetitorSignals(): Promise<CompetitorSignal[]> {
  const agent = oxylabsAgent();
  if (!agent) return [];

  const results = await Promise.allSettled(
    COMPETITORS.map(async (c) => {
      const html = await getThroughProxy(c.url, agent);
      const text = stripHtml(html).slice(0, 2500);
      return {
        name: c.name,
        source: `${c.name} (scraped live via Oxylabs)`,
        summary: text.slice(0, 200),
        url: c.url,
        date: new Date().toISOString().slice(0, 10),
        text,
      } satisfies CompetitorSignal;
    })
  );

  const ok: CompetitorSignal[] = [];
  for (const r of results) if (r.status === "fulfilled") ok.push(r.value);
  console.log(`[signals] competitor scrape: ${ok.length}/${COMPETITORS.length} via Oxylabs`);
  return ok;
}

export interface CveSignal extends Signal {
  id: string;
  severity?: string;
  package: string;
}

/** Real security advisories for key deps from OSV.dev (Google's open vuln DB). */
export async function fetchCveSignals(
  deps: { name: string; version: string }[]
): Promise<CveSignal[]> {
  const out: CveSignal[] = [];
  for (const dep of deps.slice(0, 4)) {
    try {
      const res = await fetch("https://api.osv.dev/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package: { name: dep.name, ecosystem: "npm" },
          version: dep.version,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { vulns?: any[] };
      for (const v of (data.vulns ?? []).slice(0, 2)) {
        out.push({
          id: v.id,
          package: `${dep.name}@${dep.version}`,
          source: "OSV.dev advisory DB",
          summary: (v.summary ?? v.details ?? "").slice(0, 180),
          url: `https://osv.dev/vulnerability/${v.id}`,
          severity: v.database_specific?.severity,
          date: (v.published ?? "").slice(0, 10),
        });
      }
    } catch {
      /* skip */
    }
  }
  console.log(`[signals] CVE lookup: ${out.length} advisories`);
  return out;
}

export interface SignalBundle {
  competitors: CompetitorSignal[];
  cves: CveSignal[];
  fetchedAt: string;
}

let cached: SignalBundle | null = null;

/** Last computed signals (populated during ideation) — for the Market Signals screen. */
export function cachedSignals(): SignalBundle | null {
  return cached;
}

export async function getSignals(deps: { name: string; version: string }[]): Promise<SignalBundle> {
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < 30 * 60_000) return cached;
  // Bulletproof: signals are enrichment, never a reason to fail ideation.
  const [comp, cve] = await Promise.allSettled([
    fetchCompetitorSignals(),
    fetchCveSignals(deps),
  ]);
  cached = {
    competitors: comp.status === "fulfilled" ? comp.value : [],
    cves: cve.status === "fulfilled" ? cve.value : [],
    fetchedAt: new Date().toISOString(),
  };
  return cached;
}
