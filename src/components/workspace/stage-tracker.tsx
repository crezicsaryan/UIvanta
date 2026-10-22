"use client";

import { Check, Loader2, Minus } from "lucide-react";
import type { AnalysisJob, AnalysisStage } from "@/lib/types";

const STAGES: Array<{ key: AnalysisStage; label: string; detail: string }> = [
  { key: "validating", label: "Validating input", detail: "Scheme, hostname, and DNS checks" },
  { key: "fetching", label: "Loading reference", detail: "Fetching the page through the SSRF guard" },
  { key: "capturing", label: "Reading structure", detail: "Markup, landmarks, and stylesheets" },
  { key: "extracting", label: "Extracting tokens", detail: "Colours, type scale, spacing, radii" },
  { key: "generating", label: "Writing design.md", detail: "Fourteen sections, validated" },
];

function stageIndex(stage: AnalysisStage): number {
  if (stage === "completed") return STAGES.length;
  const index = STAGES.findIndex((s) => s.key === stage);
  return index === -1 ? 0 : index;
}

export function StageTracker({ job }: { job: AnalysisJob }) {
  const current = stageIndex(job.stage);

  return (
    <div className="rounded-[26px] border border-line bg-white p-6 shadow-soft sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
            Analysis in progress
          </p>
          <p className="mt-1.5 font-display text-xl font-bold tracking-[-0.03em] text-ink">
            {job.stageLabel}
          </p>
        </div>
        <span className="font-mono text-sm text-muted">{Math.round(job.progress)}%</span>
      </div>

      <div
        className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-paper-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(job.progress)}
        aria-label="Analysis progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue via-violet to-mint transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(4, Math.min(100, job.progress))}%` }}
        />
      </div>

      <ol className="mt-6 space-y-1">
        {STAGES.map((stage, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li
              key={stage.key}
              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                active ? "bg-paper/70" : ""
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  done
                    ? "border-mint-deep bg-mint-soft text-mint-deep"
                    : active
                      ? "border-blue bg-blue text-white"
                      : "border-line bg-white text-muted-2"
                }`}
              >
                {done ? (
                  <Check className="h-3 w-3" aria-hidden="true" />
                ) : active ? (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                ) : (
                  <Minus className="h-3 w-3" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-[0.875rem] font-semibold ${
                    done || active ? "text-ink" : "text-muted-2"
                  }`}
                >
                  {stage.label}
                </span>
                <span className="block text-xs text-muted">{stage.detail}</span>
              </span>
              {active ? (
                <span className="ml-auto shrink-0 rounded-full bg-blue-soft px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wide text-blue-deep">
                  running
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        Values are read from the delivered HTML and CSS. Anything the reference doesn't prove will
        be labelled <span className="font-semibold text-ink-soft">unknown</span> — never invented.
      </p>
    </div>
  );
}
