import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// .env lives at the repo root (one level above server/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config(); // also allow a local server/.env override (Railway uses real env vars)

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  daytona: {
    apiKey: required("DAYTONA_API_KEY"),
    apiUrl: process.env.DAYTONA_API_URL || "https://app.daytona.io/api",
  },
  aiand: {
    apiKey: required("AIAND_API_KEY"),
    baseUrl: process.env.AIAND_BASE_URL || "https://api.aiand.com/v1",
    model: process.env.AIAND_MODEL || "zai-org/glm-5.2",
  },
  doubleword: {
    apiKey: required("DOUBLEWORD_API_KEY"),
    baseUrl: process.env.DOUBLEWORD_BASE_URL || "https://api.doubleword.ai/v1",
    model: process.env.DOUBLEWORD_MODEL || "Qwen/Qwen3-14B-FP8",
    embedModel: process.env.DOUBLEWORD_EMBED_MODEL || "Qwen/Qwen3-Embedding-8B",
    visionModel: process.env.DOUBLEWORD_VISION_MODEL || "",
  },
  github: {
    pat: required("GITHUB_PAT"),
    productRepo: process.env.GITHUB_REPO || "jvvinoth/SleepModePM",
    demoRepo: process.env.DEMO_REPO || "jvvinoth/mongpt-marketing",
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  },
  oxylabs: {
    user: process.env.OXYLABS_USER || "",
    pass: process.env.OXYLABS_PASS || "",
    proxyHost: process.env.OXYLABS_PROXY_HOST || "pr.oxylabs.io",
    proxyPort: process.env.OXYLABS_PROXY_PORT || "7777",
    proxyUser: process.env.OXYLABS_PROXY_USER || "",
  },
  port: Number(process.env.PORT || 8080),
};
