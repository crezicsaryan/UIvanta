"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Image as ImageIcon,
  Link2,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Upload,
  X,
} from "lucide-react";
import { samplePalette, type PaletteSample } from "@/lib/client/palette";

type Mode = "url" | "screenshot";
type Viewport = "desktop" | "tablet" | "mobile";

type ApiError = { code: string; message: string; hint?: string; retryable?: boolean };

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

const EXAMPLES = [
  { label: "linear.app", url: "https://linear.app" },
  { label: "stripe.com", url: "https://stripe.com" },
  { label: "vercel.com", url: "https://vercel.com" },
];

const VIEWPORTS: Array<{ value: Viewport; label: string; icon: typeof Monitor }> = [
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "mobile", label: "Mobile", icon: Smartphone },
];

export function AnalyzeForm({
  variant = "hero",
  initialMode = "url",
}: {
  variant?: "hero" | "page";
  initialMode?: Mode;
}) {
  const router = useRouter();
  const urlId = useId();
  const fileId = useId();
  const notesId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [url, setUrl] = useState("");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [palette, setPalette] = useState<PaletteSample[]>([]);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const resetFile = useCallback(() => {
    setFile(null);
    setPalette([]);
    setImageSize(null);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const acceptFile = useCallback(
    async (candidate: File) => {
      setError(null);
      if (!ACCEPTED.includes(candidate.type)) {
        setError({
          code: "INVALID_IMAGE",
          message: "That file type isn't supported.",
          hint: "Use a PNG, JPEG, or WebP screenshot.",
        });
        return;
      }
      if (candidate.size > MAX_BYTES) {
        setError({
          code: "IMAGE_TOO_LARGE",
          message: "That screenshot is larger than 10 MB.",
          hint: "Compress it or capture a smaller viewport.",
        });
        return;
      }
      resetFile();
      setFile(candidate);
      setPreview(URL.createObjectURL(candidate));
      try {
        const result = await samplePalette(candidate);
        setPalette(result.palette);
        setImageSize({ width: result.width, height: result.height });
      } catch {
        setError({
          code: "IMAGE_UNREADABLE",
          message: "We couldn't read that image.",
          hint: "Try re-exporting it as PNG or JPEG.",
        });
      }
    },
    [resetFile]
  );

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    if (mode === "url") {
      const value = url.trim();
      if (!value) {
        setError({
          code: "EMPTY_URL",
          message: "Enter a website URL to analyze.",
          hint: "For example https://linear.app",
        });
        inputRef.current?.focus();
        return;
      }

      // Validate the URL shape before starting a job, mirroring the server's
      // normalisation (bare domains get an https:// prefix). This avoids
      // creating a doomed job for obvious typos like "not a url".
      const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)
        ? value
        : `https://${value}`;
      let parsed: URL | null = null;
      try {
        parsed = new URL(candidate);
      } catch {
        parsed = null;
      }
      const looksLikeHost =
        parsed !== null &&
        /^[a-z0-9.-]+\.[a-z0-9]{2,}$/i.test(parsed.hostname) &&
        !/\s/.test(value);
      if (!parsed || !looksLikeHost) {
        setError({
          code: "INVALID_URL",
          message: "That doesn't look like a website address.",
          hint: "Try something like https://linear.app or linear.app",
        });
        inputRef.current?.focus();
        return;
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setError({
          code: "INVALID_URL",
          message: "Only http and https addresses can be analyzed.",
          hint: "Try the https:// version of the page.",
        });
        inputRef.current?.focus();
        return;
      }
      setSubmitting(true);
      try {
        const response = await fetch("/api/analyses", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sourceType: "url",
            url: value,
            options: { viewport, notes: notes.trim() || undefined },
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? { code: "ANALYSIS_FAILED", message: "Something went wrong." });
          setSubmitting(false);
          return;
        }
        if (data.job) {
          try {
            sessionStorage.setItem(`uivanta:job:${data.id}`, JSON.stringify(data.job));
          } catch {
            /* storage unavailable — the workspace will fall back to polling */
          }
        }
        router.push(`/analysis/${data.id}`);
      } catch {
        setError({
          code: "NETWORK_ERROR",
          message: "We couldn't reach the analysis service.",
          hint: "Check your connection and try again.",
        });
        setSubmitting(false);
      }
      return;
    }

    if (!file) {
      setError({
        code: "NO_FILE",
        message: "Choose a screenshot to analyze.",
        hint: "PNG, JPEG, or WebP up to 10 MB.",
      });
      return;
    }

    if (palette.length === 0) {
      setError({
        code: "IMAGE_UNREADABLE",
        message: "We're still reading that image. Try again in a moment.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/analyses/screenshot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          width: imageSize?.width ?? 1440,
          height: imageSize?.height ?? 900,
          viewport,
          notes: notes.trim() || undefined,
          palette,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? { code: "ANALYSIS_FAILED", message: "Something went wrong." });
        setSubmitting(false);
        return;
      }
      if (data.job) {
        try {
          sessionStorage.setItem(`uivanta:job:${data.id}`, JSON.stringify(data.job));
        } catch {
          /* storage unavailable — the workspace will fall back to polling */
        }
      }
      router.push(`/analysis/${data.id}`);
    } catch {
      setError({
        code: "NETWORK_ERROR",
        message: "We couldn't reach the analysis service.",
        hint: "Check your connection and try again.",
      });
      setSubmitting(false);
    }
  };

  const compact = variant === "hero";

  return (
    <div
      className={`relative rounded-[26px] bg-white/90 p-2 ring-1 ring-white/70 backdrop-blur-xl ${
        compact
          ? "shadow-[0_28px_70px_-32px_rgba(79,70,229,0.5)]"
          : "shadow-[0_18px_50px_-30px_rgba(79,70,229,0.35)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-1.5 pb-2 pt-1">
        <div
          role="tablist"
          aria-label="Reference type"
          className="flex rounded-full bg-paper-2/80 p-1"
        >
          {(
            [
              { value: "url", label: "Website URL", icon: Link2 },
              { value: "screenshot", label: "Screenshot", icon: ImageIcon },
            ] as const
          ).map((tab) => {
            const active = mode === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchMode(tab.value)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.8125rem] font-semibold transition-colors ${
                  active
                    ? "bg-ink text-white shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          {VIEWPORTS.map((option) => {
            const Icon = option.icon;
            const active = viewport === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                title={`${option.label} reference`}
                onClick={() => setViewport(option.value)}
                className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-full px-2.5 transition-colors ${
                  active ? "bg-blue-soft text-blue-deep" : "text-muted-2 hover:bg-paper-2 hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{option.label} viewport</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        {mode === "url" ? (
          <div className="flex flex-col gap-2 p-1 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor={urlId} className="sr-only">
                Website URL
              </label>
              <Link2
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                id={urlId}
                type="url"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                placeholder="https://linear.app"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  if (error) setError(null);
                }}
                aria-invalid={Boolean(error && (error.code === "EMPTY_URL" || error.code === "INVALID_URL"))}
                aria-describedby={error ? "analyze-error" : undefined}
                className="field h-14 rounded-2xl border-transparent bg-paper/70 pl-11 pr-3 font-medium focus:bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary h-14 shrink-0 rounded-2xl px-6 text-[0.9375rem]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Starting…
                </>
              ) : (
                <>
                  Analyze design
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-1">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const dropped = event.dataTransfer.files?.[0];
                if (dropped) void acceptFile(dropped);
              }}
              className={`rounded-2xl border border-dashed p-4 transition-colors ${
                dragging ? "border-blue bg-blue-soft/60" : "border-line-strong bg-paper/60"
              }`}
            >
              {file && preview ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Screenshot preview"
                    className="h-16 w-24 rounded-lg border border-line object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
                    <p className="text-xs text-muted">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                      {imageSize ? ` · ${imageSize.width}×${imageSize.height}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {palette.slice(0, 6).map((swatch) => (
                        <span
                          key={swatch.hex}
                          title={`${swatch.hex} · ${(swatch.coverage * 100).toFixed(1)}%`}
                          className="h-4 w-4 rounded-full ring-1 ring-ink/10"
                          style={{ backgroundColor: swatch.hex }}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetFile}
                    className="rounded-full p-2 text-muted transition-colors hover:bg-white hover:text-ink"
                    aria-label="Remove screenshot"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl px-3 py-5 text-center"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue shadow-sm">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    Drop a screenshot, or browse
                  </span>
                  <span className="text-xs text-muted">PNG, JPEG, WebP · up to 10 MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                id={fileId}
                type="file"
                accept={ACCEPTED.join(",")}
                className="sr-only"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (selected) void acceptFile(selected);
                }}
              />
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1 sm:hidden">
                {VIEWPORTS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={viewport === option.value}
                    onClick={() => setViewport(option.value)}
                    className={`chip ${viewport === option.value ? "border-blue text-blue-deep" : ""}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted">
                Pixels are sampled on your device — the image never leaves your browser.
              </p>
              <button
                type="submit"
                disabled={submitting || !file}
                className="btn btn-primary h-12 rounded-2xl px-5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Reading…
                  </>
                ) : (
                  <>
                    Analyze screenshot
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1.5 pt-1.5">
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            aria-expanded={showNotes}
            aria-controls={notesId}
            className="text-xs font-semibold text-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
          >
            {showNotes ? "Hide analysis notes" : "Add context for the analysis"}
          </button>
          {mode === "url" ? (
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-2">
                Try
              </span>
              {EXAMPLES.map((example) => (
                <button
                  key={example.url}
                  type="button"
                  onClick={() => {
                    setUrl(example.url);
                    setError(null);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-line bg-white px-2.5 py-1 text-[0.6875rem] font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
                >
                  {example.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {showNotes ? (
          <div className="px-2 pb-2 pt-1">
            <label htmlFor={notesId} className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Optional context (page type, what to focus on)
            </label>
            <textarea
              id={notesId}
              value={notes}
              onChange={(event) => setNotes(event.target.value.slice(0, 600))}
              rows={2}
              placeholder="e.g. Marketing landing page — focus on the pricing table and hero."
              className="w-full resize-none rounded-xl border border-line bg-paper/60 px-3 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:border-blue focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue/10"
            />
            <div className="mt-1 flex justify-end text-[0.6875rem] text-muted-2">{notes.length}/600</div>
          </div>
        ) : null}
      </form>

      {error ? (
        <div
          id="analyze-error"
          role="alert"
          className="mx-1 mb-1 flex items-start gap-2 rounded-xl border border-[#F3C6CD] bg-[#FDF1F3] px-3 py-2.5 text-[0.8125rem] text-[#8E2233]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{error.message}</p>
            {error.hint ? <p className="mt-0.5 text-[#A2404F]">{error.hint}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
