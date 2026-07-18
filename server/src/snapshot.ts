/**
 * Persistent ideation snapshot — "it ran overnight".
 * On boot we serve this instantly (no 2-min cold wait), then refresh in the background.
 * Committed to the repo so it ships with every Railway deploy.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { IdeationResult } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.resolve(__dirname, "../data/ideas.snapshot.json");

export function loadSnapshot(): IdeationResult | null {
  try {
    return JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as IdeationResult;
  } catch {
    return null;
  }
}

export function saveSnapshot(result: IdeationResult): void {
  try {
    mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
    writeFileSync(SNAPSHOT_PATH, JSON.stringify(result, null, 2));
    console.log("[snapshot] saved", result.cards.length, "cards");
  } catch (e) {
    console.warn("[snapshot] save failed:", (e as Error).message);
  }
}
