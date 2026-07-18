import OpenAI from "openai";
import { config } from "./config.js";

/**
 * LLM layer — sponsor-first.
 * Primary brain: AI& (glm-5.2, OpenAI-compatible).
 * Fallback + specialists: Doubleword (Qwen3 code / embeddings / vision).
 */
const aiand = new OpenAI({
  apiKey: config.aiand.apiKey,
  baseURL: config.aiand.baseUrl,
});

const doubleword = new OpenAI({
  apiKey: config.doubleword.apiKey,
  baseURL: config.doubleword.baseUrl,
});

export interface ChatOptions {
  system?: string;
  json?: boolean;
  maxTokens?: number;
}

/** Chat with AI& (primary). Falls back to Doubleword automatically on failure. */
export async function chat(prompt: string, opts: ChatOptions = {}): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: prompt });

  const request = {
    messages,
    max_tokens: opts.maxTokens ?? 4096,
    ...(opts.json ? { response_format: { type: "json_object" as const } } : {}),
  };

  try {
    const res = await aiand.chat.completions.create({
      model: config.aiand.model,
      ...request,
    });
    return res.choices[0]?.message?.content ?? "";
  } catch (err) {
    console.warn(`[llm] AI& failed (${(err as Error).message}) — falling back to Doubleword`);
    const res = await doubleword.chat.completions.create({
      model: config.doubleword.model,
      ...request,
    });
    return res.choices[0]?.message?.content ?? "";
  }
}

/** Embeddings via Doubleword (Qwen3-Embedding-8B). */
export async function embed(texts: string[]): Promise<number[][]> {
  const res = await doubleword.embeddings.create({
    model: config.doubleword.embedModel,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

/** Extract a JSON object from an LLM reply that may include prose/code fences. */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in LLM reply");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}
