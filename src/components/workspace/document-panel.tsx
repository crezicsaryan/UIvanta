"use client";

import { useDeferredValue, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  Cloud,
  CloudOff,
  Code2,
  Copy,
  Download,
  Eye,
  Loader2,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

type SaveState = "idle" | "saving" | "saved" | "error";

export function DocumentPanel({
  jobId,
  markdown,
  originalMarkdown,
  onChange,
  saveState,
  edited,
  onRegenerated,
  onFlush,
}: {
  jobId: string;
  markdown: string;
  originalMarkdown: string;
  onChange: (value: string) => void;
  saveState: SaveState;
  edited: boolean;
  onRegenerated: (markdown: string) => void;
  onFlush: () => Promise<void>;
}) {
  const [view, setView] = useState<"preview" | "source">("preview");
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const deferred = useDeferredValue(markdown);
  const stats = useMemo(() => {
    const words = markdown.trim().split(/\s+/).filter(Boolean).length;
    const lines = markdown.split("\n").length;
    return { words, lines, kb: (new Blob([markdown]).size / 1024).toFixed(1) };
  }, [markdown]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      await onFlush();
      // Generate the file client-side so export works on stateless hosts too.
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "design.md";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      // Regeneration rebuilds from the generated original. No server round-trip
      // is needed, and stateless hosts have no stored job to ask.
      onRegenerated(originalMarkdown);
    } finally {
      setRegenerating(false);
      setConfirming(false);
    }
  };

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Not saved"
          : edited
            ? "Unsaved edits"
            : "Synced";

  const SaveIcon =
    saveState === "saving"
      ? Loader2
      : saveState === "error"
        ? CloudOff
        : saveState === "saved"
          ? Check
          : Cloud;

  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-white shadow-soft">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-white/80 px-3 py-2.5 sm:px-4">
        <div role="tablist" aria-label="Document view" className="flex rounded-full bg-paper-2/80 p-0.5">
          {(
            [
              { key: "preview", label: "Preview", icon: Eye },
              { key: "source", label: "Markdown", icon: Code2 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = view === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setView(tab.key)}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <span className="hidden font-mono text-[0.625rem] text-muted-2 sm:inline">
          {stats.words.toLocaleString()} words · {stats.lines} lines · {stats.kb} kB
        </span>

        <span
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[0.5625rem] uppercase tracking-wide ${
            saveState === "error"
              ? "bg-[#FDF1F3] text-[#8E2233]"
              : saveState === "saved"
                ? "bg-mint-soft text-mint-deep"
                : "bg-paper-2 text-muted"
          }`}
        >
          <SaveIcon
            className={`h-3 w-3 ${saveState === "saving" ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {saveLabel}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-mint-deep" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={download}
            disabled={downloading}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#262135] disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            design.md
          </button>
        </div>
      </div>

      {confirming ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-[#FFF8E8] px-4 py-2.5 text-xs text-[#7A5600]">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="font-semibold">Regenerating rebuilds the document from scratch and discards your edits.</span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={regenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#7A5600] px-3 py-1.5 font-semibold text-white"
            >
              {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Regenerate
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full border border-[#E3C989] px-3 py-1.5 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {view === "preview" ? (
        <div className="scroll-thin max-h-[70vh] min-h-[28rem] overflow-y-auto px-5 py-6 sm:px-8">
          <article className="md-body mx-auto max-w-3xl">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{deferred}</ReactMarkdown>
          </article>
        </div>
      ) : (
        <div className="relative">
          <label htmlFor="markdown-source" className="sr-only">
            design.md source
          </label>
          <textarea
            id="markdown-source"
            value={markdown}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            className="scroll-thin block h-[70vh] min-h-[28rem] w-full resize-none bg-[#FCFAF9] px-4 py-4 font-mono text-[0.8125rem] leading-[1.7] text-ink outline-none focus:bg-white sm:px-6"
          />
          <div className="pointer-events-none absolute bottom-3 right-4 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[0.5625rem] uppercase tracking-wide text-muted shadow-sm">
            autosaves while you type
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
        <p className="text-[0.6875rem] text-muted">
          {edited ? (
            <>Your edits are preserved until you regenerate or start a new analysis.</>
          ) : (
            <>Generated from structured data — edit freely, the preview updates live.</>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Regenerate
          </button>
          <button
            type="button"
            onClick={download}
            disabled={downloading}
            className="btn btn-primary h-9 min-h-9 px-4 text-xs"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
