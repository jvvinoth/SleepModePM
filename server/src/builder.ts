/**
 * Builder + Critic agents — the execution half of the multi-agent loop.
 * Builder: AI& turns an approved idea card into full file changes.
 * Executor: Daytona sandbox applies them, installs, boots the app.
 * Critic: if the app fails to boot, captures the error and asks AI& to repair — once.
 * Deployer: exposes the public preview URL; can later promote to a branch + PR.
 */
import { writeFileSync } from "fs";
import { config } from "./config.js";
import { codegen, extractJson } from "./llm.js";
import { launchPreview, type LaunchResult } from "./sandbox-runner.js";
import { type BuildJob, pushEvent } from "./jobs.js";
import type { IdeaCard } from "./types.js";

const GH = "https://api.github.com";

async function fetchFile(repo: string, path: string): Promise<string | null> {
  const res = await fetch(`${GH}/repos/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${config.github.pat}`,
      Accept: "application/vnd.github.raw",
    },
  });
  return res.ok ? res.text() : null; // null = new file
}

interface Plan {
  summary: string;
  files: { path: string; content: string }[];
}

const BUILDER_SYSTEM = `You are the Builder agent of SleepMode PM. You implement approved
product changes in an existing codebase. You write complete, production-quality code that
matches the project's existing style, framework version, and conventions exactly. You return
FULL file contents (never diffs, never placeholders, never "rest of file unchanged").`;

async function generatePlan(card: IdeaCard, repo: string, repairNote?: string): Promise<Plan> {
  const fileBodies: string[] = [];
  // Cap to the primary file — smaller output = fast, reliable builds (demo-critical).
  for (const path of card.targetFiles.slice(0, 1)) {
    const content = await fetchFile(repo, path);
    fileBodies.push(
      content === null
        ? `===== FILE: ${path} (DOES NOT EXIST YET — create it) =====`
        : `===== FILE: ${path} (current content) =====\n${content.slice(0, 12000)}`
    );
  }

  const prompt = `REPO: ${repo} (Next.js 16, Tailwind v4, TypeScript, static-export marketing site)

APPROVED CHANGE:
Title: ${card.title}
Rationale: ${card.rationale}
Plan: ${card.bullets.join(" · ")}

CURRENT FILES:
${fileBodies.join("\n\n")}
${repairNote ? `\n⚠️ PREVIOUS ATTEMPT FAILED. Error from the dev server:\n${repairNote}\nFix the mistake and return corrected files.` : ""}

TASK: Implement the SINGLE most important part of this change by editing ONLY the file shown
above (return exactly ONE file). Keep it tight and self-contained — do NOT refactor unrelated
code. Preserve all existing exports, imports and behavior except what the change requires.
The app MUST still build and run.

Return ONLY JSON: {"summary":"one line describing the change","files":[{"path":"src/...","content":"<FULL new file content>"}]}`;

  const raw = await codegen(prompt, BUILDER_SYSTEM);
  try {
    writeFileSync("/tmp/lastplan.txt", raw);
  } catch {
    /* ignore */
  }
  return extractJson<Plan>(raw);
}

const DEMO_ENV = {
  NEXT_PUBLIC_APP_URL: "$PREVIEW_URL",
  NEXT_PUBLIC_WIDGET_URL: "$PREVIEW_URL",
};

/** The full approve→build→preview pipeline. Mutates job as it progresses. */
export async function runBuildJob(job: BuildJob, card: IdeaCard): Promise<void> {
  const repo = config.github.demoRepo;
  try {
    pushEvent(job, "plan:generate", `AI& implementing “${card.title}”`);
    let plan = await generatePlan(card, repo);
    job.summary = plan.summary;
    job.changedFiles = plan.files.map((f) => f.path);
    pushEvent(job, "plan:ready", plan.files.map((f) => f.path).join(", "));

    const attempt = (p: Plan): Promise<LaunchResult> =>
      launchPreview(
        {
          repo,
          port: 3100,
          env: DEMO_ENV,
          applyFiles: Object.fromEntries(p.files.map((f) => [f.path, f.content])),
        },
        (step, detail) => pushEvent(job, step, detail)
      );

    let result: LaunchResult;
    try {
      result = await attempt(plan);
    } catch (err) {
      // ── Critic loop: one bounded repair round ─────────────────────────────
      const errMsg = String((err as Error).message).slice(0, 3000);
      pushEvent(job, "critic:repair", "Build failed — Critic sent the error back to Builder");
      plan = await generatePlan(card, repo, errMsg);
      job.summary = plan.summary;
      job.changedFiles = plan.files.map((f) => f.path);
      pushEvent(job, "plan:ready", "repaired plan: " + plan.files.map((f) => f.path).join(", "));
      result = await attempt(plan);
    }

    job.result = result;
    job.sandboxId = result.sandboxId;
    job.previewUrl = result.previewUrl;
    job.status = "ready";
    pushEvent(job, "preview:ready", result.previewUrl);
  } catch (err) {
    job.status = "failed";
    job.error = String((err as Error).message).slice(0, 2000);
    pushEvent(job, "job:failed", job.error);
  }
}

/** Promote a ready job: commit the change in the sandbox, push a branch, open a PR. */
export async function promoteJob(job: BuildJob): Promise<{ branch: string; prUrl: string }> {
  if (job.status !== "ready" || !job.result) throw new Error("job is not ready to promote");
  const repo = config.github.demoRepo;
  const branch = `sleepmode/${job.cardId}-${job.id.slice(-4)}`;
  const { sandbox, appDir } = job.result;

  pushEvent(job, "promote:commit", branch);
  const script = [
    `git checkout -b ${branch}`,
    `git add -A`,
    `git -c user.name="jvvinoth" -c user.email="jvvinoth2@gmail.com" commit -m "${(job.summary ?? "SleepMode PM change").replaceAll('"', "'")}"`,
    `git push https://$GH_TOKEN@github.com/${repo}.git ${branch}`,
  ].join(" && ");
  const push = await sandbox.process.executeCommand(script, appDir, { GH_TOKEN: config.github.pat }, 120);
  if (push.exitCode !== 0) throw new Error(`git push failed: ${push.result}`);

  pushEvent(job, "promote:pr", "opening pull request");
  const prRes = await fetch(`${GH}/repos/${repo}/pulls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.github.pat}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `SleepMode PM: ${job.summary ?? job.cardId}`,
      head: branch,
      base: "main",
      body: `Automated change built & verified in Daytona sandbox \`${job.sandboxId}\`.\n\nPreview: ${job.previewUrl}\n\n🌙 Proposed, implemented and previewed by SleepMode PM.`,
    }),
  });
  if (!prRes.ok) throw new Error(`PR create failed: ${prRes.status} ${await prRes.text()}`);
  const pr = (await prRes.json()) as { html_url: string };

  job.branch = branch;
  job.prUrl = pr.html_url;
  job.status = "promoted";
  pushEvent(job, "promote:done", pr.html_url);
  return { branch, prUrl: pr.html_url };
}
