"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Plus,
  RefreshCw,
  Timer,
} from "lucide-react";
import type { AnalysisJob } from "@/lib/types";
import { Logo } from "@/components/logo";
import { StageTracker } from "./stage-tracker";
import { TokenPanel } from "./token-panel";
import { DocumentPanel } from "./document-panel";
import { ShapeCluster } from "@/components/shapes";

type SaveState = "idle" | "saving" | "saved" | "error";

export function Workspace({ id }: { id: string }) {
  const router = useRouter();
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [missing, setMissing] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [retrying, setRetrying] = useState(false);
  const initialized = useRef(false);
  const localOnly = useRef(false);

  useEffect(() => {
    // Prefer the job handed over by the form. Serverless hosts (Vercel) do not
    // share in-memory state between API routes, so polling alone is unreliable.
    try {
      const raw = sessionStorage.getItem(`uivanta:job:${id}`);
      if (raw) {
        const cached = JSON.parse(raw) as AnalysisJob;
        if (cached?.result) {
          const saved = sessionStorage.getItem(`uivanta:md:${id}`);
          const initial = saved ?? cached.editedMarkdown ?? cached.result.markdown;
          localOnly.current = true;
          setJob(cached);
          initialized.current = true;
          setMarkdown(initial);
          setBaseline(initial);
          setSaveState(saved ? "saved" : "idle");
          return;
        }
      }
    } catch {
      /* ignore malformed cache */
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const response = await fetch(`/api/analyses/${id}`, { cache: "no-store" });
        if (response.status === 404) {
          if (!cancelled) setMissing(true);
          return;
        }
        const data = (await response.json()) as AnalysisJob;
        if (cancelled) return;
        setJob(data);

        if (data.status === "completed" && data.result && !initialized.current) {
          const initial = data.editedMarkdown ?? data.result.markdown;
          initialized.current = true;
          setMarkdown(initial);
          setBaseline(initial);
          setSaveState(data.editedMarkdown ? "saved" : "idle");
          return;
        }
        if (data.status === "failed") return;
        if (data.status === "completed") return;

        timer = setTimeout(tick, 1100);
      } catch {
        if (!cancelled) timer = setTimeout(tick, 2200);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  const save = useCallback(
    async (value: string) => {
      setSaveState("saving");
      try {
        sessionStorage.setItem(`uivanta:md:${id}`, value);
      } catch {
        /* storage unavailable */
      }
      if (localOnly.current) {
        // Stateless deployments keep the document in this browser session only.
        setBaseline(value);
        setSaveState("saved");
        return;
      }
      try {
        const response = await fetch(`/api/analyses/${id}/result`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ markdown: value }),
        });
        if (!response.ok) throw new Error("save failed");
        setBaseline(value);
        setSaveState("saved");
      } catch {
        setBaseline(value);
        setSaveState("saved");
      }
    },
    [id]
  );

  useEffect(() => {
    if (markdown === null || baseline === null) return;
    if (markdown === baseline) return;
    const timer = setTimeout(() => void save(markdown), 900);
    return () => clearTimeout(timer);
  }, [markdown, baseline, save]);

  const flush = useCallback(async () => {
    if (markdown !== null && baseline !== null && markdown !== baseline) {
      await save(markdown);
    }
  }, [markdown, baseline, save]);

  const retry = async () => {
    if (!job || job.sourceType !== "url" || !job.sourceUrl) {
      router.push("/analyze");
      return;
    }
    setRetrying(true);
    try {
      const response = await fetch("/api/analyses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceType: "url",
          url: job.sourceUrl,
          options: { viewport: job.viewport, notes: job.notes },
        }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.job) {
          try {
            sessionStorage.setItem(`uivanta:job:${data.id}`, JSON.stringify(data.job));
          } catch {
            /* ignore */
          }
        }
        router.replace(`/analysis/${data.id}`);
        return;
      }
    } catch {
      /* fall through */
    }
    setRetrying(false);
  };

  if (missing) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-paper-2 text-muted">
            <Timer className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-ink">This analysis has expired</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            UIvanta keeps documents for two hours and then discards them. Nothing was saved to an
            account.
          </p>
          <Link href="/analyze" className="btn btn-primary mt-6">
            Start a new analysis
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Shell>
    );
  }

  if (!job) {
    return (
      <Shell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted">
          <Loader2 className="h-6 w-6 animate-spin text-blue" aria-hidden="true" />
          <p className="text-sm">Opening the workspace…</p>
        </div>
      </Shell>
    );
  }

  if (job.status === "failed") {
    return (
      <Shell>
        <div className="mx-auto max-w-xl py-10">
          <div className="rounded-[26px] border border-[#F3C6CD] bg-[#FDF1F3] p-6 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#B3313F]">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-xl font-extrabold text-[#7C1F2B]">
              {job.error?.message ?? "The analysis failed."}
            </h1>
            {job.error?.hint ? (
              <p className="mt-2 text-sm leading-relaxed text-[#93404C]">{job.error.hint}</p>
            ) : null}
            <p className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[#B3313F]/70">
              {job.error?.code ?? "ANALYSIS_FAILED"}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {job.error?.retryable ? (
                <button
                  type="button"
                  onClick={retry}
                  disabled={retrying}
                  className="btn btn-primary h-11 px-5 text-sm"
                >
                  {retrying ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  )}
                  Try again
                </button>
              ) : null}
              <Link href="/analyze" className="btn btn-outline h-11 px-5 text-sm">
                Upload a screenshot instead
              </Link>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (job.status !== "completed" || !job.result) {
    return (
      <Shell>
        <div className="grid gap-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
          <div>
            <p className="eyebrow">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              Working
            </p>
            <h1 className="mt-3 text-[2rem] font-extrabold leading-[1.05] text-ink sm:text-[2.4rem]">
              Reading the reference design.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              {job.sourceType === "url" ? (
                <>
                  Analysing{" "}
                  <span className="font-mono text-[0.8125rem] text-ink-soft">{job.sourceUrl}</span>.
                  This usually takes 5–20 seconds.
                </>
              ) : (
                <>Sampling the uploaded screenshot. This usually takes a few seconds.</>
              )}
            </p>
            <div className="mt-6">
              <StageTracker job={job} />
            </div>
          </div>

          <div className="relative hidden items-center justify-center lg:flex">
            <div className="relative flex h-72 w-72 items-center justify-center">
              <span className="absolute inset-0 animate-[spin_18s_linear_infinite] rounded-full border border-dashed border-line-strong" />
              <span className="absolute inset-6 animate-[spin_26s_linear_infinite_reverse] rounded-full border border-line" />
              <span className="absolute inset-12 rounded-full bg-gradient-to-br from-blue-soft via-white to-mint-soft" />
              <span className="relative font-display text-4xl font-extrabold tracking-tight text-blue">
                {Math.round(job.progress)}%
              </span>
            </div>
            <ShapeCluster className="pointer-events-none absolute -bottom-4 right-0 w-40" />
          </div>
        </div>
      </Shell>
    );
  }

  const edited = job.editedMarkdown !== undefined || (markdown !== null && baseline !== null && markdown !== baseline);

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-6">
        <div className="min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Home
          </Link>
          <h1 className="mt-2 truncate text-[1.75rem] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-[2.1rem]">
            {job.result.reference.title}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-deep" />
              Document ready
            </span>
            <span aria-hidden="true">·</span>
            <span>{job.result.stats.tokens} tokens</span>
            <span aria-hidden="true">·</span>
            <span>{job.result.stats.components} components</span>
            <span aria-hidden="true">·</span>
            <span>{job.result.stats.sections} sections</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/analyze" className="btn btn-outline h-10 min-h-10 px-4 text-xs">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New analysis
          </Link>
        </div>
      </div>

      <div className="grid gap-5 pb-16 lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
        <main className="order-1 min-w-0 lg:order-2">
          {markdown !== null ? (
            <DocumentPanel
              jobId={id}
              markdown={markdown}
              originalMarkdown={job.result.markdown}
              onChange={setMarkdown}
              saveState={saveState}
              edited={edited}
              onRegenerated={(next) => {
                setMarkdown(next);
                setBaseline(next);
                setSaveState("saved");
                setJob((current) => (current ? { ...current, editedMarkdown: undefined } : current));
              }}
              onFlush={flush}
            />
          ) : (
            <div className="flex h-72 items-center justify-center rounded-[24px] border border-line bg-white">
              <Loader2 className="h-5 w-5 animate-spin text-blue" aria-hidden="true" />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white/70 px-4 py-3 text-[0.75rem] text-muted">
            <span className="font-semibold text-ink">Next step:</span>
            <span>
              Paste the file into Cursor or Claude Code and ask it to build §9 first, then apply §13.
            </span>
          </div>
        </main>

        <aside className="order-2 lg:order-1">
          <div className="scroll-thin lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1">
            <TokenPanel job={job} />
          </div>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-xl">
        <div className="container-x flex h-[4rem] items-center justify-between">
          <Logo compact />
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted-2">
            workspace
          </span>
        </div>
      </header>
      <main id="main" className="container-x">
        {children}
      </main>
    </div>
  );
}
