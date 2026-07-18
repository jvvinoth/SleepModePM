/**
 * Business side — Knowledge Base + Leads.
 * The company crawls its site into a knowledge base; the AI agent is "trained" on it; then
 * SleepMode PM generates the leads that agent would capture — with questions grounded in the
 * ACTUAL crawled content. Starts empty: add knowledge → get relevant leads.
 */
import { codegen, extractJson } from "./llm.js";

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

// Empty to start — the KB is built by crawling real URLs.
export const knowledgeBase: KnowledgeBase = {
  total: 0,
  trained: 0,
  pending: 0,
  failed: 0,
  site: "",
  documents: [],
};

let kbText = ""; // accumulated crawled text — the agent's brain
export let leads: Lead[] = [];
export let leadsStatus: "empty" | "generating" | "ready" = "empty";

export function addCrawledDoc(doc: KnowledgeDoc, text: string, site: string) {
  knowledgeBase.documents.unshift(doc);
  knowledgeBase.total += 1;
  knowledgeBase.trained += 1;
  if (!knowledgeBase.site) knowledgeBase.site = site;
  kbText = (kbText + "\n\n" + text).slice(-12000); // keep recent context bounded
}

export function leadsState() {
  return { leads, status: leadsStatus };
}

export function getLead(id: string): Lead | undefined {
  return leads.find((l) => l.id === id);
}

/** Generate leads grounded in the crawled knowledge base (Doubleword, fast JSON). */
export async function regenerateLeads(): Promise<void> {
  if (!kbText.trim()) {
    leads = [];
    leadsStatus = "empty";
    return;
  }
  leadsStatus = "generating";
  const prompt = `This company's AI support agent is trained on the following knowledge-base content:

${kbText.slice(0, 7000)}

Generate 6 realistic sales leads — website visitors who chatted with this agent. Each lead's
QUESTION must reference specific things from the content above (products, features, pricing,
docs — whatever is actually there). Mix: 2 hot, 2 warm, 2 cold.

Return ONLY JSON:
{"leads":[{"name":"...","company":"...","initials":"XX","score":0-100,"temperature":"hot|warm|cold",
"intent":"one line why they matter","signals":["buying signal","..."],
"question":"what they asked (grounded in the content)","source":"/a-path","language":"English|中文|हिन्दी|Bahasa|日本語","lastActive":"2m ago"}]}`;

  try {
    const raw = await codegen(prompt, "You generate realistic B2B sales leads as strict JSON, grounded in the given content.");
    const parsed = extractJson<{ leads: Lead[] }>(raw);
    leads = (parsed.leads ?? []).map((l, i) => ({ ...l, id: `ld-${i + 1}`, alerted: false }));
    leadsStatus = "ready";
    console.log(`[leads] generated ${leads.length} from knowledge base`);
  } catch (e) {
    console.warn("[leads] generation failed:", (e as Error).message);
    leadsStatus = leads.length ? "ready" : "empty";
  }
}
