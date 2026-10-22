"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Layers, Palette, Type } from "lucide-react";
import type { AnalysisJob, DesignToken, TokenGroup } from "@/lib/types";

const GROUP_META: Record<TokenGroup, { label: string; icon: typeof Palette; open: boolean }> = {
  color: { label: "Colour", icon: Palette, open: true },
  typography: { label: "Typography", icon: Type, open: true },
  spacing: { label: "Spacing", icon: Layers, open: false },
  radius: { label: "Radii", icon: Layers, open: false },
  shadow: { label: "Elevation", icon: Layers, open: false },
  layout: { label: "Layout", icon: Layers, open: false },
};

const DOT: Record<DesignToken["confidence"], string> = {
  observed: "bg-mint-deep",
  estimated: "bg-[#E0A100]",
  unknown: "bg-line-strong",
};

function TokenRow({ token }: { token: DesignToken }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${token.name}: ${token.value};`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <li className="group flex items-center gap-2 py-1.5">
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[token.confidence]}`}
        title={token.confidence}
      />
      <span className="min-w-0 flex-1 truncate font-mono text-[0.6875rem] text-muted">
        {token.name}
      </span>
      <span className="max-w-[8.5rem] truncate font-mono text-[0.6875rem] font-medium text-ink">
        {token.value}
      </span>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded p-1 text-muted-2 opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
        aria-label={`Copy ${token.name}`}
      >
        {copied ? (
          <Check className="h-3 w-3 text-mint-deep" aria-hidden="true" />
        ) : (
          <Copy className="h-3 w-3" aria-hidden="true" />
        )}
      </button>
    </li>
  );
}

export function TokenPanel({ job }: { job: AnalysisJob }) {
  const result = job.result;
  if (!result) return null;

  const { reference, tokens, components, stats } = result;
  const groups = (Object.keys(GROUP_META) as TokenGroup[])
    .map((key) => ({ key, tokens: tokens.filter((t) => t.group === key) }))
    .filter((g) => g.tokens.length > 0);

  const sourceLabel =
    reference.kind === "url" ? reference.domain ?? reference.url : "Uploaded screenshot";

  return (
    <div className="space-y-4">
      <section className="rounded-[22px] border border-line bg-white p-4 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-paper-2 text-xs font-bold text-ink-soft">
            {reference.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={reference.favicon}
                alt=""
                className="h-full w-full object-cover"
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              (sourceLabel ?? "UI").slice(0, 2).toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-ink">{reference.title}</h2>
            <p className="truncate font-mono text-[0.6875rem] text-muted">{sourceLabel}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="chip">{reference.viewport}</span>
          <span className="chip capitalize">{reference.kind === "url" ? "URL analysis" : "Screenshot"}</span>
          {reference.stylesheets > 0 ? (
            <span className="chip">{reference.stylesheets} stylesheets</span>
          ) : null}
        </div>

        {reference.kind === "url" && reference.url ? (
          <a
            href={reference.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-[0.75rem] font-semibold text-blue hover:underline"
          >
            Open reference
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : null}
      </section>

      <section className="rounded-[22px] border border-line bg-white p-4 shadow-soft">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-ink">Extraction</h2>
          <span className="font-mono text-[0.625rem] text-muted">
            {Math.round(stats.durationMs / 100) / 10}s
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: "observed", value: stats.confidence.observed, tone: "text-mint-deep" },
            { label: "estimated", value: stats.confidence.estimated, tone: "text-[#9A6B00]" },
            { label: "unknown", value: stats.confidence.unknown, tone: "text-muted" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-paper/70 px-2.5 py-2">
              <p className={`font-display text-lg font-extrabold leading-none ${item.tone}`}>
                {item.value}
              </p>
              <p className="mt-1 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-muted">
                {item.label}
              </p>
            </div>
          ))}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.6875rem]">
          <div className="flex justify-between">
            <dt className="text-muted">Tokens</dt>
            <dd className="font-mono font-medium text-ink">{stats.tokens}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Components</dt>
            <dd className="font-mono font-medium text-ink">{stats.components}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Sections</dt>
            <dd className="font-mono font-medium text-ink">{stats.sections}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Colours</dt>
            <dd className="font-mono font-medium text-ink">{stats.colors}</dd>
          </div>
        </dl>
      </section>

      {reference.palette.length > 0 ? (
        <section className="rounded-[22px] border border-line bg-white p-4 shadow-soft">
          <h2 className="text-sm font-bold text-ink">Sampled palette</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {reference.palette.map((swatch) => (
              <div key={`${swatch.hex}-${swatch.role}`} className="min-w-0">
                <div
                  className="h-10 w-full rounded-lg ring-1 ring-ink/10"
                  style={{ backgroundColor: swatch.hex }}
                />
                <p className="mt-1 truncate font-mono text-[0.625rem] text-ink">{swatch.hex}</p>
                <p className="truncate text-[0.625rem] text-muted">{swatch.role}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[22px] border border-line bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Design tokens</h2>
          <span className="font-mono text-[0.625rem] text-muted">{tokens.length}</span>
        </div>
        <div className="mt-2 divide-y divide-line/70">
          {groups.map((group) => {
            const meta = GROUP_META[group.key];
            const Icon = meta.icon;
            return (
              <details key={group.key} open={meta.open} className="group py-2">
                <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-[0.75rem] font-semibold text-ink-soft [&::-webkit-details-marker]:hidden">
                  <Icon className="h-3.5 w-3.5 text-muted-2" aria-hidden="true" />
                  {meta.label}
                  <span className="ml-auto font-mono text-[0.625rem] font-normal text-muted-2">
                    {group.tokens.length}
                  </span>
                </summary>
                <ul className="mt-1">
                  {group.tokens.map((token) => (
                    <TokenRow key={`${token.name}-${token.value}`} token={token} />
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </section>

      {components.length > 0 ? (
        <section className="rounded-[22px] border border-line bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Components</h2>
            <span className="font-mono text-[0.625rem] text-muted">{components.length}</span>
          </div>
          <ul className="mt-2 space-y-2">
            {components.map((component) => (
              <li key={component.name} className="rounded-xl bg-paper/60 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.8125rem] font-semibold text-ink">{component.name}</p>
                  <span className="font-mono text-[0.625rem] text-muted">{component.count}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[0.6875rem] leading-relaxed text-muted">
                  {component.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {reference.limitations.length > 0 ? (
        <section className="rounded-[22px] border border-line bg-paper-2/50 p-4">
          <h2 className="text-sm font-bold text-ink">Limitations</h2>
          <ul className="mt-2 space-y-1.5">
            {reference.limitations.map((limitation) => (
              <li key={limitation} className="text-[0.6875rem] leading-relaxed text-muted">
                · {limitation}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
