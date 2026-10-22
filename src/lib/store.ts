import { analyzeUrl } from "@/lib/analyzer/url";
import { analyzeScreenshot, type ScreenshotInput } from "@/lib/analyzer/screenshot";
import { AnalysisError } from "@/lib/errors";
import type { AnalysisJob, AnalysisStage, Viewport } from "@/lib/types";

/**
 * In-memory job store.
 *
 * UIvanta runs without accounts, so analyses live in process memory for a short
 * retention window (2 hours) and are then dropped. Swap this module for a
 * Postgres/Redis-backed store when persistence is introduced.
 */

type Store = {
  jobs: Map<string, AnalysisJob>;
  hits: Map<string, number[]>;
};

const globalRef = globalThis as unknown as { __uivanta?: Store };
const store: Store = (globalRef.__uivanta ??= { jobs: new Map(), hits: new Map() });

const RETENTION_MS = 2 * 60 * 60 * 1000;
const MAX_JOBS = 250;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 12;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function now() {
  return new Date().toISOString();
}

function prune() {
  const cutoff = Date.now() - RETENTION_MS;
  for (const [id, job] of store.jobs) {
    if (new Date(job.createdAt).getTime() < cutoff) store.jobs.delete(id);
  }
  if (store.jobs.size > MAX_JOBS) {
    const ordered = Array.from(store.jobs.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const excess = store.jobs.size - MAX_JOBS;
    for (let i = 0; i < excess; i++) store.jobs.delete(ordered[i].id);
  }
  for (const [key, timestamps] of store.hits) {
    const fresh = timestamps.filter((t) => Date.now() - t < RATE_WINDOW_MS);
    if (fresh.length === 0) store.hits.delete(key);
    else store.hits.set(key, fresh);
  }
}

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; retryAfter: number } {
  prune();
  const timestamps = (store.hits.get(key) ?? []).filter((t) => Date.now() - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    const oldest = Math.min(...timestamps);
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((RATE_WINDOW_MS - (Date.now() - oldest)) / 1000),
    };
  }
  timestamps.push(Date.now());
  store.hits.set(key, timestamps);
  return { allowed: true, remaining: RATE_LIMIT - timestamps.length, retryAfter: 0 };
}

function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `an_${Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12)}`;
}

export function createJob(input: {
  sourceType: "url" | "screenshot";
  sourceUrl?: string;
  viewport: Viewport;
  notes?: string;
}): AnalysisJob {
  prune();
  const job: AnalysisJob = {
    id: newId(),
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    status: "queued",
    stage: "validating",
    stageLabel: "Validating input",
    progress: 6,
    createdAt: now(),
    updatedAt: now(),
    viewport: input.viewport,
    notes: input.notes,
    edits: 0,
  };
  store.jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): AnalysisJob | undefined {
  prune();
  return store.jobs.get(id);
}

function patchJob(id: string, patch: Partial<AnalysisJob>) {
  const job = store.jobs.get(id);
  if (!job) return;
  Object.assign(job, patch, { updatedAt: now() });
}

function advance(id: string, stage: AnalysisStage, label: string, progress: number) {
  patchJob(id, { stage, stageLabel: label, progress, status: "processing" });
}

export async function runUrlAnalysis(id: string, url: string, viewport: Viewport) {
  try {
    advance(id, "fetching", "Loading the reference page", 12);
    await sleep(180);

    const result = await analyzeUrl(url, viewport, (stage, progress, label) => {
      advance(id, stage, label, progress);
    });

    advance(id, "generating", "Validating the document", 94);
    await sleep(160);

    patchJob(id, {
      status: "completed",
      stage: "completed",
      stageLabel: "Completed",
      progress: 100,
      completedAt: now(),
      result,
      editedMarkdown: undefined,
    });
  } catch (error) {
    const isKnown = error instanceof AnalysisError;
    patchJob(id, {
      status: "failed",
      stage: "failed",
      stageLabel: "Failed",
      progress: 100,
      completedAt: now(),
      error: {
        code: isKnown ? error.code : "ANALYSIS_FAILED",
        message: isKnown ? error.message : "The analysis could not be completed.",
        retryable: isKnown ? error.retryable : true,
        hint: isKnown ? error.hint : "Try again, or upload a screenshot instead.",
      },
    });
  }
}

export async function runScreenshotAnalysis(id: string, input: ScreenshotInput) {
  try {
    advance(id, "capturing", "Reading image pixels", 30);
    await sleep(220);
    advance(id, "extracting", "Sampling the colour palette", 62);
    await sleep(200);

    const result = analyzeScreenshot(input);

    advance(id, "generating", "Writing design.md", 88);
    await sleep(180);

    patchJob(id, {
      status: "completed",
      stage: "completed",
      stageLabel: "Completed",
      progress: 100,
      completedAt: now(),
      result,
    });
  } catch (error) {
    patchJob(id, {
      status: "failed",
      stage: "failed",
      stageLabel: "Failed",
      progress: 100,
      completedAt: now(),
      error: {
        code: error instanceof Error && error.message === "NO_SIGNAL" ? "NO_SIGNAL" : "ANALYSIS_FAILED",
        message:
          error instanceof Error && error.message === "NO_SIGNAL"
            ? "We couldn't read enough colour information from that image."
            : "The screenshot analysis could not be completed.",
        retryable: true,
        hint: "Try a larger, less compressed screenshot.",
      },
    });
  }
}

export function saveMarkdown(id: string, markdown: string): boolean {
  const job = store.jobs.get(id);
  if (!job || job.status !== "completed") return false;
  job.editedMarkdown = markdown;
  job.edits += 1;
  job.updatedAt = now();
  return true;
}

export function discardEdits(id: string): boolean {
  const job = store.jobs.get(id);
  if (!job) return false;
  job.editedMarkdown = undefined;
  job.updatedAt = now();
  return true;
}

export function regenerate(id: string): boolean {
  const job = store.jobs.get(id);
  if (!job || !job.result) return false;
  // Rebuild the document from the stored structured data — user edits are
  // discarded only because the caller explicitly asked for a regeneration.
  job.editedMarkdown = undefined;
  job.updatedAt = now();
  return true;
}

export function currentMarkdown(job: AnalysisJob): string {
  return job.editedMarkdown ?? job.result?.markdown ?? "";
}

export function storeStats() {
  return { jobs: store.jobs.size };
}
