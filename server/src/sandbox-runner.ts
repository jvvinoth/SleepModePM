/**
 * Sandbox Runner — the execution engine behind the Builder/Deployer agents.
 * Wraps Daytona: create sandbox → clone repo → install → run dev server → public preview URL.
 * Learned in Sprint 0: run dev servers via nohup (sessions exit early), and write app env
 * vars to .env.local before boot.
 */
import { Daytona, Sandbox } from "@daytona/sdk";
import { config } from "./config.js";

export interface LaunchOptions {
  repo: string; // "owner/name"
  port: number; // app dev-server port
  env?: Record<string, string>; // written to .env.local (values may use $PREVIEW_URL)
  branch?: string;
  setupCommand?: string; // default: npm install
  devCommand?: string; // default: npx next dev -p <port> -H 0.0.0.0
  /** files to write into the repo after clone (path → full content) — the Builder's changes */
  applyFiles?: Record<string, string>;
}

export interface LaunchResult {
  sandbox: Sandbox;
  sandboxId: string;
  appDir: string;
  previewUrl: string;
}

const daytona = new Daytona({
  apiKey: config.daytona.apiKey,
  apiUrl: config.daytona.apiUrl,
});

export type ProgressFn = (step: string, detail?: string) => void;

/** Clone a repo into a fresh sandbox, install deps, boot its dev server, return preview URL. */
export async function launchPreview(
  opts: LaunchOptions,
  onProgress: ProgressFn = () => {}
): Promise<LaunchResult> {
  onProgress("sandbox:create");
  const sandbox = await daytona.create({ public: true, autoStopInterval: 60 });
  onProgress("sandbox:ready", sandbox.id);

  const root = (await sandbox.getUserRootDir()) ?? "/home/daytona";
  const appDir = `${root}/app`;

  onProgress("repo:clone", opts.repo);
  const branchFlag = opts.branch ? `--branch ${opts.branch} ` : "";
  const clone = await sandbox.process.executeCommand(
    `git clone --depth 1 ${branchFlag}https://$GH_TOKEN@github.com/${opts.repo}.git app`,
    root,
    { GH_TOKEN: config.github.pat },
    180
  );
  if (clone.exitCode !== 0) throw new Error(`clone failed: ${clone.result}`);

  if (opts.applyFiles && Object.keys(opts.applyFiles).length) {
    onProgress("files:apply", Object.keys(opts.applyFiles).join(", "));
    for (const [path, content] of Object.entries(opts.applyFiles)) {
      const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : ".";
      await sandbox.process.executeCommand(`mkdir -p "${dir}"`, appDir);
      await sandbox.fs.uploadFile(Buffer.from(content, "utf8"), `${appDir}/${path}`);
    }
  }

  onProgress("deps:install");
  const setup = opts.setupCommand ?? "npm install --no-audit --no-fund";
  const install = await sandbox.process.executeCommand(`${setup} 2>&1 | tail -3`, appDir, undefined, 600);
  if (install.exitCode !== 0) throw new Error(`install failed: ${install.result}`);

  const preview = await sandbox.getPreviewLink(opts.port);

  if (opts.env && Object.keys(opts.env).length) {
    onProgress("env:write");
    const lines = Object.entries(opts.env)
      .map(([k, v]) => `${k}=${v.replaceAll("$PREVIEW_URL", preview.url)}`)
      .join("\n");
    await sandbox.fs.uploadFile(Buffer.from(lines + "\n"), `${appDir}/.env.local`);
  }

  onProgress("server:start");
  const dev = opts.devCommand ?? `npx next dev -p ${opts.port} -H 0.0.0.0`;
  await sandbox.process.executeCommand(
    `nohup ${dev} > /tmp/dev.log 2>&1 & echo $!`,
    appDir,
    undefined,
    30
  );

  onProgress("server:poll", preview.url);
  for (let i = 0; i < 45; i++) {
    try {
      const res = await fetch(preview.url, { signal: AbortSignal.timeout(5000) });
      if (res.status < 500) {
        onProgress("server:up", `HTTP ${res.status}`);
        return { sandbox, sandboxId: sandbox.id, appDir, previewUrl: preview.url };
      }
    } catch {
      /* booting */
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
  const log = await sandbox.process.executeCommand("tail -20 /tmp/dev.log", appDir);
  throw new Error(`dev server never answered. log tail:\n${log.result}`);
}

/** Run a shell command inside an existing sandbox's app dir (used by Builder/Critic). */
export async function runInSandbox(
  result: LaunchResult,
  command: string,
  timeoutSec = 120
): Promise<{ exitCode: number; output: string }> {
  const res = await result.sandbox.process.executeCommand(command, result.appDir, undefined, timeoutSec);
  return { exitCode: res.exitCode ?? -1, output: res.result ?? "" };
}

export async function destroySandbox(sandboxId: string): Promise<void> {
  const sandbox = await daytona.get(sandboxId);
  await sandbox.delete();
}
