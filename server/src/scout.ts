/**
 * Scout agent — reads a GitHub repo and produces a compact context bundle
 * for the Ideator. RAG-lite: no vector DB, just smart file selection into
 * the LLM's (1M-token) context window.
 */
import { config } from "./config.js";

const GH = "https://api.github.com";

async function gh(path: string, raw = false): Promise<any> {
  const res = await fetch(`${GH}${path}`, {
    headers: {
      Authorization: `Bearer ${config.github.pat}`,
      Accept: raw ? "application/vnd.github.raw" : "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error(`GitHub ${path} → ${res.status}`);
  return raw ? res.text() : res.json();
}

export interface RepoContext {
  repo: string;
  meta: { description: string; language: string; defaultBranch: string };
  tree: string[]; // all file paths
  files: Record<string, string>; // path → content (key files only)
}

const KEY_FILES = [
  "package.json",
  "README.md",
  "next.config.ts",
  "next.config.js",
  "tailwind.config.ts",
];

/** Paths worth reading beyond the fixed key files: pages, main components, libs. */
function pickInteresting(tree: string[]): string[] {
  const src = tree.filter(
    (p) =>
      /^(src\/)?(app|pages|components|lib|functions)\//.test(p) &&
      /\.(tsx?|jsx?|mjs)$/.test(p) &&
      !p.includes("test") &&
      !p.includes(".d.ts")
  );
  // prefer pages & top-level components, cap to keep context tight
  const ranked = src.sort((a, b) => a.split("/").length - b.split("/").length);
  return ranked.slice(0, 14);
}

export async function scoutRepo(repo: string = config.github.demoRepo): Promise<RepoContext> {
  const meta = await gh(`/repos/${repo}`);
  const branch = meta.default_branch ?? "main";
  const treeRes = await gh(`/repos/${repo}/git/trees/${branch}?recursive=1`);
  const tree: string[] = treeRes.tree
    .filter((n: any) => n.type === "blob")
    .map((n: any) => n.path);

  const wanted = [...KEY_FILES.filter((f) => tree.includes(f)), ...pickInteresting(tree)];
  const files: Record<string, string> = {};
  await Promise.all(
    wanted.map(async (path) => {
      try {
        const content = await gh(`/repos/${repo}/contents/${path}?ref=${branch}`, true);
        files[path] = String(content).slice(0, 6000); // cap each file
      } catch {
        /* skip unreadable */
      }
    })
  );

  return {
    repo,
    meta: {
      description: meta.description ?? "",
      language: meta.language ?? "",
      defaultBranch: branch,
    },
    tree,
    files,
  };
}

/** Render the context as a compact prompt block. */
export function renderContext(ctx: RepoContext): string {
  const fileList = ctx.tree.slice(0, 300).join("\n");
  const bodies = Object.entries(ctx.files)
    .map(([p, c]) => `\n===== FILE: ${p} =====\n${c}`)
    .join("\n");
  return `REPO: ${ctx.repo}
DESCRIPTION: ${ctx.meta.description}
LANGUAGE: ${ctx.meta.language}

FILE TREE (${ctx.tree.length} files):
${fileList}

KEY FILE CONTENTS:${bodies}`;
}
