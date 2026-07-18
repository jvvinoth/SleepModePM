/** In-memory build-job store — the live activity feed the console polls. */
import type { LaunchResult } from "./sandbox-runner.js";

export interface JobEvent {
  t: string; // ISO time
  step: string; // machine step id, e.g. "sandbox:create"
  detail?: string;
}

export type JobStatus = "running" | "ready" | "failed" | "promoted";

export interface BuildJob {
  id: string;
  cardId: string;
  status: JobStatus;
  events: JobEvent[];
  previewUrl?: string;
  sandboxId?: string;
  summary?: string;
  changedFiles?: string[];
  branch?: string;
  prUrl?: string;
  error?: string;
  /** live handle to the sandbox (in-process only, not serialized) */
  result?: LaunchResult;
}

const jobs = new Map<string, BuildJob>();

export function createJob(cardId: string): BuildJob {
  const job: BuildJob = {
    id: `job-${Date.now().toString(36)}`,
    cardId,
    status: "running",
    events: [],
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): BuildJob | undefined {
  return jobs.get(id);
}

export function pushEvent(job: BuildJob, step: string, detail?: string) {
  job.events.push({ t: new Date().toISOString(), step, detail });
  console.log(`[job ${job.id}] ${step} ${detail ?? ""}`);
}

/** JSON-safe view (strips the live sandbox handle). */
export function serializeJob(job: BuildJob) {
  const { result: _, ...rest } = job;
  return rest;
}
