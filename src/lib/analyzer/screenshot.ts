import type {
  AnalysisResult,
  DesignToken,
  PaletteSwatch,
  ReferenceInfo,
  Viewport,
} from "@/lib/types";
import { contrastRatio, parseColor, rgbToHsl, toHex } from "./color";
import { generateMarkdown } from "./markdown";

export type ScreenshotSample = {
  hex: string;
  coverage: number;
};

export type ScreenshotInput = {
  palette: ScreenshotSample[];
  width: number;
  height: number;
  viewport: Viewport;
  notes?: string;
  fileName?: string;
};

function token(
  name: string,
  label: string,
  value: string,
  evidence: string,
  confidence: DesignToken["confidence"] = "estimated",
  occurrences = 0
): DesignToken {
  return { group: "color", name, label, value, evidence, confidence, occurrences };
}

export function analyzeScreenshot(input: ScreenshotInput): AnalysisResult {
  const started = Date.now();
  const samples = input.palette
    .map((s) => ({ ...s, rgb: parseColor(s.hex) }))
    .filter((s): s is ScreenshotSample & { rgb: NonNullable<ReturnType<typeof parseColor>> } => Boolean(s.rgb))
    .sort((a, b) => b.coverage - a.coverage)
    .slice(0, 10);

  if (samples.length === 0) {
    throw new Error("NO_SIGNAL");
  }

  const withHsl = samples.map((s) => ({ ...s, hsl: rgbToHsl(s.rgb) }));
  const byLum = [...withHsl].sort((a, b) => b.hsl.l - a.hsl.l);

  const background =
    byLum.find((s) => s.coverage > 0.18 && s.hsl.l > 0.7) ??
    byLum[0] ??
    withHsl[0];

  const text =
    [...withHsl]
      .filter((s) => s.hex !== background.hex)
      .sort((a, b) => a.hsl.l - b.hsl.l)[0] ?? background;

  const vivid = [...withHsl]
    .filter((s) => s.hex !== background.hex && s.hsl.s > 0.25 && s.hsl.l > 0.12 && s.hsl.l < 0.82)
    .sort((a, b) => b.hsl.s * (0.4 + b.coverage) - a.hsl.s * (0.4 + a.coverage));

  const primary = vivid[0] ?? null;
  const accent = vivid.find((s) => s.hex !== primary?.hex) ?? null;

  const muted =
    [...withHsl]
      .filter((s) => s.hex !== background.hex && s.hsl.l > 0.28 && s.hsl.l < 0.75)
      .sort((a, b) => b.coverage - a.coverage)[0] ?? null;

  const border =
    [...withHsl]
      .filter((s) => s.hex !== background.hex && s.hsl.l > 0.6 && s.hsl.l < 0.95 && s.hsl.s < 0.35)
      .sort((a, b) => b.coverage - a.coverage)[0] ?? null;

  const pct = (n: number) => `${Math.round(n * 100)}% of sampled pixels`;

  const tokens: DesignToken[] = [
    token(
      "--color-background",
      "Background",
      background.hex,
      `Dominant surface colour — ${pct(background.coverage)}.`,
      "estimated",
      Math.round(background.coverage * 1000)
    ),
    token("--color-text", "Text", text.hex, `Darkest sampled colour — ${pct(text.coverage)}.`, "estimated"),
  ];

  if (primary) {
    tokens.splice(1, 0, token("--color-primary", "Primary", primary.hex, `Most saturated sampled colour — ${pct(primary.coverage)}.`, "estimated"));
  }
  if (accent) {
    tokens.push(token("--color-accent", "Accent", accent.hex, `Second distinct saturated colour — ${pct(accent.coverage)}.`, "estimated"));
  }
  if (muted) {
    tokens.push(token("--color-text-muted", "Muted text", muted.hex, `Mid-tone colour — ${pct(muted.coverage)}.`, "estimated"));
  }
  if (border) {
    tokens.push(token("--color-border", "Border", border.hex, `Low-contrast divider tone — ${pct(border.coverage)}.`, "estimated"));
  }

  const bgRgb = parseColor(background.hex);
  const textRgb = parseColor(text.hex);
  if (bgRgb && textRgb) {
    const ratio = contrastRatio(bgRgb, textRgb);
    tokens.push(
      token(
        "--contrast-body",
        "Body contrast",
        `${ratio.toFixed(2)}:1`,
        ratio >= 4.5
          ? "Sampled text/canvas pair meets WCAG AA."
          : "Sampled text/canvas pair is below WCAG AA — treat as a warning, not a specification.",
        "estimated"
      )
    );
  }

  const palette: PaletteSwatch[] = withHsl.map((s) => ({
    hex: s.hex,
    role:
      s.hex === background.hex
        ? "Background"
        : s.hex === text.hex
          ? "Text"
          : s.hex === primary?.hex
            ? "Primary"
            : s.hex === accent?.hex
              ? "Accent"
              : "Observed",
    occurrences: Math.round(s.coverage * 1000),
    confidence: "estimated",
  }));

  const aspect = input.width / Math.max(1, input.height);
  const limitations = [
    "Screenshot analysis reads pixels only — typography, spacing, radii, and component geometry cannot be measured reliably.",
    "Colour roles are inferred from coverage and saturation; confirm each value against the original page.",
    "Hidden states, responsive behaviour, and interaction feedback are not present in a static image.",
    "No HTML or CSS was fetched, so no component inventory could be produced.",
  ];

  const reference: ReferenceInfo = {
    kind: "screenshot",
    title: input.fileName ? `Screenshot — ${input.fileName}` : "Uploaded screenshot",
    description:
      input.notes?.trim() ||
      `Pixel analysis of a ${input.width}×${input.height} capture (${aspect.toFixed(2)}:1 aspect ratio).`,
    viewport: input.viewport,
    palette,
    sections: [],
    counts: {
      sections: 0,
      headings: 0,
      buttons: 0,
      links: 0,
      images: 0,
      inputs: 0,
      cards: 0,
      forms: 0,
      navLinks: 0,
      footerLinks: 0,
    },
    fontFaces: [],
    stylesheets: 0,
    cssBytes: 0,
    capturedAt: new Date().toISOString(),
    notes: input.notes,
    limitations,
  };

  const markdown = generateMarkdown({
    reference,
    tokens,
    components: [],
    states: { hover: 0, focus: 0, active: 0, disabled: 0, transitions: 0 },
    mediaQueries: [],
    darkMode: rgbToHsl(background.rgb).l < 0.3,
  });

  return {
    reference,
    tokens,
    components: [],
    markdown,
    stats: {
      tokens: tokens.length,
      colors: palette.length,
      components: 0,
      sections: 0,
      confidence: {
        observed: 0,
        estimated: tokens.length,
        unknown: 0,
      },
      durationMs: Date.now() - started,
    },
  };
}

/** Small helper used by the client-side sampler for stable hex output. */
export function normalizeHex(r: number, g: number, b: number): string {
  return toHex({ r, g, b, a: 1 });
}
