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

  const read = (res: OpenAI.ChatCompletion, who: string) => {
    const choice = res.choices[0];
    const msg = choice?.message as (typeof choice.message & { reasoning_content?: string }) | undefined;
    const content = msg?.content?.trim() || msg?.reasoning_content?.trim() || "";
    console.log(`[llm] ${who} finish=${choice?.finish_reason} len=${content.length}`);
    return content;
  };

  try {
    const res = await aiand.chat.completions.create({ model: config.aiand.model, ...request });
    const out = read(res, "AI&");
    if (!out) throw new Error("empty content");
    return out;
  } catch (err) {
    console.warn(`[llm] AI& failed (${(err as Error).message}) — falling back to Doubleword`);
    const res = await doubleword.chat.completions.create({ model: config.doubleword.model, ...request });
    return read(res, "Doubleword");
  }
}

/**
 * Code generation — routed to Doubleword's Qwen3 code model (fast, deterministic, great at
 * JSON), with AI& as fallback. Used by the Builder agent. Logs raw reply for debugging.
 */
export async function codegen(prompt: string, system: string): Promise<string> {
  const request = {
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: prompt },
    ],
    max_tokens: 16000,
    temperature: 0.2,
    response_format: { type: "json_object" as const },
  };
  try {
    const res = await doubleword.chat.completions.create({ model: config.doubleword.model, ...request });
    const out = res.choices[0]?.message?.content?.trim() ?? "";
    console.log(`[llm] codegen(Doubleword) finish=${res.choices[0]?.finish_reason} len=${out.length}`);
    if (out) return out;
    throw new Error("empty");
  } catch (err) {
    console.warn(`[llm] Doubleword codegen failed (${(err as Error).message}) — trying AI&`);
    const res = await aiand.chat.completions.create({ model: config.aiand.model, ...request });
    const out = res.choices[0]?.message?.content?.trim() ?? "";
    console.log(`[llm] codegen(AI&) finish=${res.choices[0]?.finish_reason} len=${out.length}`);
    return out;
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

/** Extract a JSON object from an LLM reply that may include reasoning tags / prose / fences. */
export function extractJson<T>(text: string): T {
  // strip reasoning-model think blocks
  let t = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) t = fenced[1];
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error(
      `No JSON object found in LLM reply (len=${text.length}, head="${text.slice(0, 120).replace(/\n/g, " ")}")`
    );
  }
  return JSON.parse(t.slice(start, end + 1)) as T;
}
