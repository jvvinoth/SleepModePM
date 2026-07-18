/**
 * Signals agent — the outside-world intelligence that makes SleepMode PM a product
 * strategist, not a coding agent.
 *
 * 1. Competitor intel: scrapes competitor sites THROUGH the Oxylabs residential proxy
 *    (clean IPs, no blocks). Graceful: if the proxy is unreachable (some venue networks
 *    kill CONNECT tunnels), signals are simply omitted.
 * 2. Security advisories: real CVE data for the repo's dependencies from OSV.dev.
 */
import { ProxyAgent } from "undici";
import { config } from "./config.js";
import type { Signal } from "./types.js";

// Competitors of the demo product (MonGPT = AI support-agent for Asian markets)
const COMPETITORS = [
  { name: "Intercom", url: "https://www.intercom.com" },
  { name: "Tidio", url: "https://www.tidio.com" },
  { name: "Crisp", url: "https://crisp.chat/en/" },
];

function oxylabsDispatcher(): ProxyAgent | null {
  const { proxyHost, proxyPort, proxyUser, pass } = {
    proxyHost: config.oxylabs.proxyHost,
    proxyPort: config.oxylabs.proxyPort,
    proxyUser: config.oxylabs.proxyUser,
    pass: config.oxylabs.pass,
  };
  if (!proxyUser || !pass) return null;
  return new ProxyAgent({
    uri: `http://${proxyHost}:${proxyPort}`,
    token: "Basic " + Buffer.from(`${proxyUser}:${pass}`).toString("base64"),
    connectTimeout: 12000,
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

export interface CompetitorSignal extends Signal {
  name: string;
  text: string; // extracted page text for the Ideator
}

/** Scrape competitor homepages through Oxylabs. Failures are skipped silently. */
export async function fetchCompetitorSignals(): Promise<CompetitorSignal[]> {
  const dispatcher = oxylabsDispatcher();
  if (!dispatcher) return [];

  const results = await Promise.allSettled(
    COMPETITORS.map(async (c) => {
      const res = await fetch(c.url, {
        // @ts-expect-error undici dispatcher passthrough
        dispatcher,
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const text = stripHtml(await res.text()).slice(0, 2500);
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

  const ok = results.filter((r): r is PromiseFulfilledResult<CompetitorSignal> => r.status === "fulfilled");
  console.log(`[signals] competitor scrape: ${ok.length}/${COMPETITORS.length} via Oxylabs`);
  return ok.map((r) => r.value);
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

export async function getSignals(deps: { name: string; version: string }[]): Promise<SignalBundle> {
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < 30 * 60_000) return cached;
  const [competitors, cves] = await Promise.all([
    fetchCompetitorSignals(),
    fetchCveSignals(deps),
  ]);
  cached = { competitors, cves, fetchedAt: new Date().toISOString() };
  return cached;
}
