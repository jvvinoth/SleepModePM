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

/** Backup leads shown ONLY when no real (crawl-generated) leads exist yet — so the
 *  dashboard is never empty for a demo. Real crawled leads always take precedence. */
const FALLBACK_LEADS: Lead[] = [
  {
    id: "fb-1", name: "Daniel Ong", company: "ShopEasy SG", initials: "DO",
    score: 91, temperature: "hot",
    intent: "SME owner — wants a chatbot live on his store this week",
    signals: ["asked to install on website", "Tamil + English", "ready this week"],
    question: "I need a chatbot for my website that can answer in Tamil and English. How fast can I go live?",
    source: "/pricing", language: "English", lastActive: "3m ago",
  },
  {
    id: "fb-2", name: "Yuki Sato", company: "Sato Retail", initials: "YS",
    score: 87, temperature: "hot",
    intent: "Wants a voice bot for phone support in Japanese",
    signals: ["asked about voice bot", "phone support", "Japanese"],
    question: "Do you have a voice bot? I want customers to call and talk to the AI in Japanese.",
    source: "/features/voice", language: "日本語", lastActive: "9m ago",
  },
  {
    id: "fb-3", name: "Anand Prakash", company: "DesiMart", initials: "AP",
    score: 83, temperature: "hot",
    intent: "Needs multi-language support across his sites",
    signals: ["multiple localizations", "Hindi + Tamil + English", "3 sites"],
    question: "I need multiple localizations for my website — can one bot handle Hindi, Tamil and English?",
    source: "/features/languages", language: "हिन्दी", lastActive: "18m ago",
  },
  {
    id: "fb-4", name: "Mei Ling", company: "Bloom Cafe", initials: "ML",
    score: 62, temperature: "warm",
    intent: "Wants to train the bot on her menu & FAQ",
    signals: ["asked to train on docs", "small business"],
    question: "Can I train the bot on my product docs and FAQ so it answers customers accurately?",
    source: "/docs/getting-started", language: "中文", lastActive: "1h ago",
  },
  {
    id: "fb-5", name: "Farah Aziz", company: "Aziz Travels", initials: "FA",
    score: 55, temperature: "warm",
    intent: "Comparing plans for a small team",
    signals: ["viewed pricing", "Bahasa support"],
    question: "How much for a small business, and does it support Bahasa Melayu?",
    source: "/pricing", language: "Bahasa", lastActive: "2h ago",
  },
  {
    id: "fb-6", name: "Rahul Sharma", company: "—", initials: "RS",
    score: 24, temperature: "cold",
    intent: "Just exploring, wants a free trial",
    signals: ["asked free trial"],
    question: "Is there a free trial so I can test it before paying?",
    source: "/", language: "English", lastActive: "6h ago",
  },
];

export function addCrawledDoc(doc: KnowledgeDoc, text: string, site: string) {
  knowledgeBase.documents.unshift(doc);
  knowledgeBase.total += 1;
  knowledgeBase.trained += 1;
  if (!knowledgeBase.site) knowledgeBase.site = site;
  kbText = (kbText + "\n\n" + text).slice(-12000); // keep recent context bounded
}

export function leadsState() {
  // Real crawl-generated leads win; otherwise show the backup set so it's never empty.
  if (leads.length) return { leads, status: leadsStatus };
  if (leadsStatus === "generating") return { leads: [], status: "generating" };
  return { leads: FALLBACK_LEADS, status: "ready" };
}

export function getLead(id: string): Lead | undefined {
  return leads.find((l) => l.id === id) ?? FALLBACK_LEADS.find((l) => l.id === id);
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
