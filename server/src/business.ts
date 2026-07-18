/**
 * Business side — Knowledge Base + Leads.
 * The company crawls its site/docs into a knowledge base; the AI agent uses it to talk to
 * visitors; conversations become leads scored Hot / Warm / Cold. Hot leads alert the team.
 */

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
  score: number; // 0-100 intent
  temperature: Temp;
  intent: string; // one-line summary
  signals: string[]; // buying signals
  question: string; // what they actually asked the agent
  source: string; // page / entry point
  language: string;
  lastActive: string;
  alerted?: boolean;
}

const DOCS: KnowledgeDoc[] = [
  ["/pricing", 8], ["/enterprise", 12], ["/features/voice", 9], ["/features/languages", 11],
  ["/docs/getting-started", 14], ["/docs/api", 22], ["/security", 7], ["/about-us", 7],
  ["/case-studies", 16], ["/integrations/slack", 6], ["/integrations/whatsapp", 6],
  ["/terms-conditions", 19], ["/privacy-policy", 15],
].map(([p, c]) => ({ path: p as string, url: `https://monstarx.com${p}`, chunks: c as number, status: "trained" as const }));

export const knowledgeBase: KnowledgeBase = {
  total: 157,
  trained: 157,
  pending: 0,
  failed: 0,
  site: "monstarx.com",
  documents: DOCS,
};

export const leads: Lead[] = [
  {
    id: "ld-1", name: "Priya Raman", company: "Zomato Enterprise", initials: "PR",
    score: 94, temperature: "hot",
    intent: "Enterprise buyer — 500 seats, asked about SSO & Tamil support",
    signals: ["viewed /enterprise 4×", "asked about SSO/SAML", "500+ seats", "requested demo"],
    question: "Do you support SAML SSO and can the agent handle Tamil + Hindi for 500 agents?",
    source: "/enterprise", language: "English", lastActive: "2m ago",
  },
  {
    id: "ld-2", name: "Kenji Watanabe", company: "Rakuten", initials: "KW",
    score: 88, temperature: "hot",
    intent: "Evaluating vs Intercom — asked for pricing on 200 seats",
    signals: ["compared /pricing 3×", "mentioned Intercom", "asked about Japanese voice"],
    question: "How does your Japanese voice quality compare to Intercom Fin? Pricing for 200 seats?",
    source: "/pricing", language: "日本語", lastActive: "6m ago",
  },
  {
    id: "ld-3", name: "Aisha Rahman", company: "Grab", initials: "AR",
    score: 82, temperature: "hot",
    intent: "Wants WhatsApp + Malay; ready to trial this week",
    signals: ["asked WhatsApp integration", "Malay + English", "timeline: this week"],
    question: "Can we deploy on WhatsApp with Bahasa Melayu support and start a trial this week?",
    source: "/integrations/whatsapp", language: "Bahasa", lastActive: "11m ago",
  },
  {
    id: "ld-4", name: "David Lim", company: "Shopee SMB", initials: "DL",
    score: 64, temperature: "warm",
    intent: "SMB owner comparing plans, no timeline yet",
    signals: ["viewed /pricing", "asked about free tier"],
    question: "Is there a free tier for a small shop? How many conversations included?",
    source: "/pricing", language: "English", lastActive: "34m ago",
  },
  {
    id: "ld-5", name: "Meera Nair", company: "BigBasket", initials: "MN",
    score: 58, temperature: "warm",
    intent: "Asked about API + Hindi, exploring",
    signals: ["read /docs/api", "asked Hindi support"],
    question: "Do you have a REST API and does the bot answer in Hindi from our docs?",
    source: "/docs/api", language: "हिन्दी", lastActive: "1h ago",
  },
  {
    id: "ld-6", name: "Tan Wei Ming", company: "Freelancer", initials: "TW",
    score: 41, temperature: "warm",
    intent: "Curious about voice feature, early research",
    signals: ["watched voice demo", "single user"],
    question: "How natural is the voice agent? Is it good enough for customer calls?",
    source: "/features/voice", language: "中文", lastActive: "2h ago",
  },
  {
    id: "ld-7", name: "Ravi Kumar", company: "—", initials: "RK",
    score: 22, temperature: "cold",
    intent: "Student researching, no buying intent",
    signals: ["read /about-us", "no pricing views"],
    question: "What tech stack do you use for the AI agent?",
    source: "/about-us", language: "English", lastActive: "5h ago",
  },
  {
    id: "ld-8", name: "Nurul Huda", company: "—", initials: "NH",
    score: 18, temperature: "cold",
    intent: "General question, browsing",
    signals: ["1 page view"],
    question: "Where are your servers located?",
    source: "/security", language: "Bahasa", lastActive: "yesterday",
  },
];

export function getLead(id: string): Lead | undefined {
  return leads.find((l) => l.id === id);
}
