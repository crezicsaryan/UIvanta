import type { Declaration } from "./css";
import {
  contrastRatio,
  findColorLiterals,
  isNeutral,
  parseColor,
  rgbToHsl,
  toHex,
  type RGB,
} from "./color";
import type { Confidence, DesignToken, PaletteSwatch } from "@/lib/types";

type ColorContext = "background" | "text" | "border" | "shadow" | "graphic" | "custom";

type ColorEntry = {
  hex: string;
  rgb: RGB;
  count: number;
  contexts: Record<ColorContext, number>;
  selectors: Map<string, number>;
  raw: string;
};

const SELECTOR_HINTS = {
  primary: /(^|[-_.\s:])(btn|button|primary|accent|cta|brand|link|toggle|badge)\b/i,
  body: /(^|[\s,>])(html|body|:root)\b/i,
  heading: /(^|[\s,>])(h1|h2|h3|h4|h5|h6|heading|display|hero|title)\b/i,
  card: /(card|panel|surface|tile|box|sheet|modal)\b/i,
  muted: /(muted|secondary|subtle|dim|disabled|placeholder|caption)\b/i,
  border: /(border|divider|outline|ring|separator)\b/i,
  success: /(success|positive|valid|complete)\b/i,
  danger: /(danger|error|destructive|invalid|warning|alert)\b/i,
};

function contextFor(property: string): ColorContext | null {
  if (property === "color" || property === "caret-color" || property === "-webkit-text-fill-color") {
    return "text";
  }
  if (property.startsWith("background")) return "background";
  if (property.startsWith("border") || property.startsWith("outline")) return "border";
  if (property.includes("shadow")) return "shadow";
  if (property === "fill" || property === "stroke") return "graphic";
  if (property.startsWith("--")) return "custom";
  return null;
}

function numericValues(value: string): number[] {
  const out: number[] = [];
  const re = /(-?\d*\.?\d+)\s*(px|rem|em)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value))) {
    const n = parseFloat(m[1]);
    if (!Number.isFinite(n)) continue;
    out.push(m[2].toLowerCase() === "px" ? n : n * 16);
  }
  return out;
}

function shortSelector(selector: string): string {
  const first = selector.split(",")[0].trim();
  return first.length > 46 ? `${first.slice(0, 43)}…` : first;
}

function round(n: number, digits = 0): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function normalizeFamily(value: string): string | null {
  const first = value.split(",")[0]?.trim().replace(/^['"]|['"]$/g, "");
  if (!first) return null;
  if (/^(inherit|initial|unset|revert|sans-serif|serif|monospace|system-ui|ui-sans-serif)$/i.test(first)) {
    return null;
  }
  if (first.startsWith("var(")) return null;
  return first;
}

export type Extraction = {
  tokens: DesignToken[];
  palette: PaletteSwatch[];
  fontFamilies: string[];
  darkMode: boolean;
  baseUnit: number;
};

export function extractTokens(declarations: Declaration[]): Extraction {
  const colors = new Map<string, ColorEntry>();
  const families = new Map<string, number>();
  const sizes = new Map<number, number>();
  const lineHeights = new Map<string, number>();
  const weights = new Map<string, number>();
  const spacing = new Map<number, number>();
  const radii = new Map<number, number>();
  const shadows = new Map<string, { count: number; sample: string }>();
  const widths = new Map<string, number>();
  const fontFaceFamilies = new Set<string>();

  const pushColor = (rgb: RGB, context: ColorContext, selector: string, raw: string) => {
    if (rgb.a < 0.2) return;
    const hex = toHex(rgb);
    const existing = colors.get(hex);
    if (existing) {
      existing.count += 1;
      existing.contexts[context] += 1;
      existing.selectors.set(selector, (existing.selectors.get(selector) ?? 0) + 1);
      return;
    }
    colors.set(hex, {
      hex,
      rgb,
      count: 1,
      contexts: { background: 0, text: 0, border: 0, shadow: 0, graphic: 0, custom: 0 },
      selectors: new Map([[selector, 1]]),
      raw,
    });
  };

  for (const decl of declarations) {
    const { property, value, selector } = decl;

    const context = contextFor(property);
    if (context) {
      for (const literal of findColorLiterals(value)) {
        const parsed = parseColor(literal);
        if (parsed) pushColor(parsed, context, selector, value);
      }
    }

    if (property === "font-family") {
      const family = normalizeFamily(value);
      if (family) families.set(family, (families.get(family) ?? 0) + 1);
    }

    if (property === "font-size") {
      const values = numericValues(value);
      for (const size of values) {
        if (size >= 8 && size <= 200) sizes.set(round(size), (sizes.get(round(size)) ?? 0) + 1);
      }
    }

    if (property === "line-height") {
      const trimmed = value.trim();
      if (/^\d*\.?\d+$/.test(trimmed)) {
        lineHeights.set(trimmed, (lineHeights.get(trimmed) ?? 0) + 1);
      } else {
        const values = numericValues(trimmed);
        if (values[0] && values[0] >= 8 && values[0] <= 120) {
          const key = `${round(values[0])}px`;
          lineHeights.set(key, (lineHeights.get(key) ?? 0) + 1);
        }
      }
    }

    if (property === "font-weight") {
      const w = value.trim();
      if (/^(normal|bold|lighter|bolder|\d{3})$/.test(w)) {
        weights.set(w, (weights.get(w) ?? 0) + 1);
      }
    }

    if (/^(padding|margin|gap|row-gap|column-gap)(-|$)/.test(property)) {
      for (const n of numericValues(value)) {
        if (n > 0 && n <= 200) spacing.set(round(n), (spacing.get(round(n)) ?? 0) + 1);
      }
    }

    if (property === "border-radius") {
      for (const n of numericValues(value)) {
        if (n >= 0 && n <= 400) radii.set(round(n), (radii.get(round(n)) ?? 0) + 1);
      }
      if (/50%|999px|9999px|100vmax|999rem/i.test(value)) {
        radii.set(999, (radii.get(999) ?? 0) + 1);
      }
    }

    if (property === "box-shadow" && value !== "none") {
      const normalized = value.replace(/\s+/g, " ").trim();
      const existing = shadows.get(normalized);
      shadows.set(normalized, {
        count: (existing?.count ?? 0) + 1,
        sample: normalized,
      });
    }

    if (property === "max-width" && /px|rem|ch|vw/i.test(value)) {
      const normalized = value.replace(/\s+/g, "");
      widths.set(normalized, (widths.get(normalized) ?? 0) + 1);
    }

    if (property === "--font-family" || property === "--font-sans" || property === "--font-display") {
      const family = normalizeFamily(value);
      if (family) fontFaceFamilies.add(family);
    }
  }

  /* ---------------- colour roles ---------------- */

  const colorList = Array.from(colors.values()).sort((a, b) => b.count - a.count);

  // Merge near-identical colours (anti-aliasing / alpha variants) into the dominant entry.
  const merged: ColorEntry[] = [];
  for (const entry of colorList) {
    const twin = merged.find((m) => {
      const d =
        Math.abs(m.rgb.r - entry.rgb.r) +
        Math.abs(m.rgb.g - entry.rgb.g) +
        Math.abs(m.rgb.b - entry.rgb.b);
      return d <= 14;
    });
    if (twin) {
      twin.count += entry.count;
      for (const key of Object.keys(entry.contexts) as ColorContext[]) {
        twin.contexts[key] += entry.contexts[key];
      }
      continue;
    }
    merged.push({ ...entry, selectors: new Map(entry.selectors) });
  }

  const byContext = (ctx: ColorContext) =>
    merged.filter((c) => c.contexts[ctx] > 0).sort((a, b) => b.contexts[ctx] - a.contexts[ctx]);

  const selectorMatches = (entry: ColorEntry, re: RegExp) =>
    Array.from(entry.selectors.keys()).some((s) => re.test(s));

  const pickBodyBackground = () => {
    const candidates = merged.filter(
      (c) =>
        c.contexts.background > 0 &&
        selectorMatches(c, SELECTOR_HINTS.body) &&
        !selectorMatches(c, /(btn|button|badge|chip|tag)/i)
    );
    return candidates.sort((a, b) => b.contexts.background - a.contexts.background)[0] ?? null;
  };

  const pageBg = pickBodyBackground();
  const bgList = byContext("background");
  const lightBackgrounds = bgList.filter((c) => rgbToHsl(c.rgb).l > 0.82);
  const fallbackBg = lightBackgrounds[0] ?? bgList[0] ?? null;
  const background = pageBg ?? fallbackBg;

  const textList = byContext("text");
  const bodyText =
    textList.find((c) => selectorMatches(c, SELECTOR_HINTS.body)) ??
    textList.filter((c) => rgbToHsl(c.rgb).l < 0.4)[0] ??
    textList[0] ??
    null;

  const borderList = byContext("border").filter((c) => !background || c.hex !== background.hex);
  const border = borderList[0] ?? null;

  const primaryCandidates = merged
    .filter((c) => c.contexts.background > 0 || c.contexts.graphic > 0 || c.contexts.custom > 0)
    .map((c) => {
      const hsl = rgbToHsl(c.rgb);
      const saturation = hsl.s;
      const keywordBoost = selectorMatches(c, SELECTOR_HINTS.primary) ? 40 : 0;
      const customBoost = c.contexts.custom > 0 ? 12 : 0;
      const vividBoost = saturation > 0.35 && hsl.l > 0.18 && hsl.l < 0.78 ? 18 : 0;
      const penalty = isNeutral(c.rgb) ? -25 : 0;
      return { entry: c, score: c.count + keywordBoost + customBoost + vividBoost + penalty, hsl };
    })
    .filter((c) => c.hsl.s > 0.18)
    .sort((a, b) => b.score - a.score);

  const primary = primaryCandidates[0]?.entry ?? null;
  const accent =
    primaryCandidates.find(
      (c) =>
        c.entry.hex !== primary?.hex &&
        hueDistance(c.hsl.h, primary ? rgbToHsl(primary.rgb).h : 0) > 45
    )?.entry ?? null;

  const success =
    merged.find(
      (c) =>
        selectorMatches(c, SELECTOR_HINTS.success) &&
        rgbToHsl(c.rgb).s > 0.25 &&
        /green|success|positive/.test(Array.from(c.selectors.keys()).join(" "))
    ) ?? null;
  const danger =
    merged.find(
      (c) =>
        selectorMatches(c, SELECTOR_HINTS.danger) &&
        rgbToHsl(c.rgb).s > 0.3 &&
        rgbToHsl(c.rgb).h < 25
    ) ?? null;

  const surface =
    lightBackgrounds.find((c) => c.hex !== background?.hex && !isNeutral(c.rgb) === false) ??
    lightBackgrounds.find((c) => c.hex !== background?.hex) ??
    null;

  const mutedText =
    textList
      .filter((c) => {
        const { l } = rgbToHsl(c.rgb);
        return l > 0.3 && l < 0.72;
      })
      .sort((a, b) => b.count - a.count)[0] ?? null;

  const tokens: DesignToken[] = [];

  const addColor = (
    label: string,
    name: string,
    entry: ColorEntry | null,
    roleConfidence: Confidence,
    roleNote: string,
    fallback?: string
  ) => {
    if (!entry) {
      if (!fallback) return;
      tokens.push({
        group: "color",
        name,
        label,
        value: fallback,
        confidence: "unknown",
        evidence: "Not declared in the reference stylesheet — default supplied.",
        occurrences: 0,
      });
      return;
    }
    const sample = Array.from(entry.selectors.entries()).sort((a, b) => b[1] - a[1])[0];
    tokens.push({
      group: "color",
      name,
      label,
      value: entry.hex,
      confidence: roleConfidence,
      evidence: `${roleNote} · ${entry.count} declaration${entry.count === 1 ? "" : "s"}${
        sample ? `, e.g. \`${shortSelector(sample[0])}\`` : ""
      }`,
      occurrences: entry.count,
    });
  };

  const explicitToken = (names: string[]) => {
    for (const decl of declarations) {
      if (decl.custom && names.includes(decl.property)) {
        for (const literal of findColorLiterals(decl.value)) {
          const rgb = parseColor(literal);
          if (!rgb) continue;
          const hex = toHex(rgb);
          return merged.find((c) => c.hex === hex) ?? null;
        }
      }
    }
    return null;
  };

  addColor(
    "Background",
    "--color-background",
    explicitToken(["--background", "--color-background", "--bg", "--surface"]) ?? background,
    explicitToken(["--background", "--color-background", "--bg", "--surface"]) ? "observed" : "estimated",
    "Page-level surface"
  );
  addColor("Surface", "--color-surface", surface, "estimated", "Card / panel fill");
  addColor(
    "Primary",
    "--color-primary",
    explicitToken(["--primary", "--color-primary", "--brand", "--accent"]) ?? primary,
    explicitToken(["--primary", "--color-primary", "--brand", "--accent"]) ||
      (primary && selectorMatches(primary, SELECTOR_HINTS.primary))
      ? "observed"
      : "estimated",
    "Highest-usage saturated fill"
  );
  addColor("Accent", "--color-accent", accent, "estimated", "Secondary saturated fill");
  addColor(
    "Text",
    "--color-text",
    explicitToken(["--foreground", "--text", "--color-text"]) ?? bodyText,
    "observed",
    "Body copy colour"
  );
  addColor("Muted text", "--color-text-muted", mutedText, "estimated", "Lower-emphasis copy");
  addColor("Border", "--color-border", border, "estimated", "Dividers and outlines");
  if (success) addColor("Success", "--color-success", success, "observed", "Semantic success colour");
  if (danger) addColor("Danger", "--color-danger", danger, "observed", "Semantic error colour");

  if (background && bodyText) {
    const ratio = contrastRatio(background.rgb, bodyText.rgb);
    tokens.push({
      group: "color",
      name: "--contrast-body",
      label: "Body contrast",
      value: `${ratio.toFixed(2)}:1`,
      confidence: "observed",
      evidence:
        ratio >= 4.5
          ? "Meets WCAG AA for normal text."
          : "Below the 4.5:1 WCAG AA threshold — verify before shipping.",
      occurrences: 0,
    });
  }

  /* ---------------- typography ---------------- */

  const familyList = Array.from(families.entries()).sort((a, b) => b[1] - a[1]);
  const displayFamily =
    familyList.find(([name]) => {
      for (const decl of declarations) {
        if (decl.property === "font-family" && normalizeFamily(decl.value) === name) {
          if (SELECTOR_HINTS.heading.test(decl.selector)) return true;
        }
      }
      return false;
    })?.[0] ?? familyList[0]?.[0];

  const monoFamily =
    familyList.find(([name]) => /mono|code|consolas|menlo|fira code|jetbrains/i.test(name))?.[0];

  if (familyList[0]) {
    tokens.push({
      group: "typography",
      name: "--font-sans",
      label: "Body typeface",
      value: familyList[0][0],
      confidence: "observed",
      evidence: `Most-used family — ${familyList[0][1]} declarations.`,
      occurrences: familyList[0][1],
    });
  }
  if (displayFamily && displayFamily !== familyList[0]?.[0]) {
    tokens.push({
      group: "typography",
      name: "--font-display",
      label: "Display typeface",
      value: displayFamily,
      confidence: "estimated",
      evidence: "Used on heading selectors in the reference stylesheet.",
      occurrences: familyList.find(([n]) => n === displayFamily)?.[1] ?? 0,
    });
  }
  if (monoFamily) {
    tokens.push({
      group: "typography",
      name: "--font-mono",
      label: "Monospace typeface",
      value: monoFamily,
      confidence: "observed",
      evidence: "Declared for code or preformatted content.",
      occurrences: familyList.find(([n]) => n === monoFamily)?.[1] ?? 0,
    });
  }
  if (fontFaceFamilies.size > 0) {
    tokens.push({
      group: "typography",
      name: "--font-custom",
      label: "Custom-property family",
      value: Array.from(fontFaceFamilies)[0],
      confidence: "observed",
      evidence: "Declared through a CSS custom property.",
      occurrences: 1,
    });
  }

  const sizeList = Array.from(sizes.entries()).sort((a, b) => b[0] - a[0]);
  const sizeLabels = [
    "Display",
    "Heading 1",
    "Heading 2",
    "Heading 3",
    "Body large",
    "Body",
    "Small",
    "Caption",
  ];
  const sizeNames = [
    "--text-display",
    "--text-h1",
    "--text-h2",
    "--text-h3",
    "--text-lg",
    "--text-base",
    "--text-sm",
    "--text-xs",
  ];

  const bodySize =
    sizeList
      .filter(([size]) => size >= 14 && size <= 18)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 16;

  // Keep distinct sizes, drop near-duplicates (1px apart), cap at 8.
  const distinctSizes: Array<[number, number]> = [];
  for (const entry of sizeList) {
    if (distinctSizes.some(([s]) => Math.abs(s - entry[0]) < 1.5)) continue;
    distinctSizes.push(entry);
    if (distinctSizes.length >= 8) break;
  }

  distinctSizes.forEach(([size, count], index) => {
    const label = sizeLabels[index] ?? `Step ${index + 1}`;
    const name = sizeNames[index] ?? `--text-${index + 1}`;
    tokens.push({
      group: "typography",
      name,
      label: `${label} size`,
      value: `${round(size)}px`,
      confidence: "observed",
      evidence: `${count} font-size declaration${count === 1 ? "" : "s"}; role assignment is inferred from the scale order.`,
      occurrences: count,
    });
  });

  if (!distinctSizes.some(([s]) => s === bodySize)) {
    tokens.push({
      group: "typography",
      name: "--text-base",
      label: "Body size",
      value: `${round(bodySize)}px`,
      confidence: "estimated",
      evidence: "No explicit body font-size found — 16px browser default assumed.",
      occurrences: 0,
    });
  }

  const lhEntry = Array.from(lineHeights.entries()).sort((a, b) => b[1] - a[1])[0];
  if (lhEntry) {
    tokens.push({
      group: "typography",
      name: "--leading-body",
      label: "Body line-height",
      value: lhEntry[0],
      confidence: "observed",
      evidence: `${lhEntry[1]} line-height declarations.`,
      occurrences: lhEntry[1],
    });
  }

  const weightEntries = Array.from(weights.entries()).sort((a, b) => b[1] - a[1]);
  if (weightEntries.length) {
    tokens.push({
      group: "typography",
      name: "--weight-body",
      label: "Body weight",
      value: weightEntries[0][0],
      confidence: "observed",
      evidence: `${weightEntries[0][1]} font-weight declarations.`,
      occurrences: weightEntries[0][1],
    });
    const bold = weightEntries.find(([w]) => w === "bold" || Number(w) >= 600);
    if (bold) {
      tokens.push({
        group: "typography",
        name: "--weight-heading",
        label: "Heading weight",
        value: bold[0],
        confidence: "observed",
        evidence: "Heaviest weight used on headings.",
        occurrences: bold[1],
      });
    }
  }

  /* ---------------- spacing ---------------- */

  const spacingList = Array.from(spacing.entries()).sort((a, b) => b[1] - a[1]);
  const candidates = spacingList.filter(([v]) => v >= 2 && v <= 16).map(([v]) => v);
  let baseUnit = 8;
  if (candidates.length) {
    const counts = new Map<number, number>();
    for (const [v, c] of spacingList) {
      if (v >= 2 && v <= 16) counts.set(v, (counts.get(v) ?? 0) + c);
    }
    baseUnit = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
  }

  const stepNames = [
    [1, "--space-1"],
    [2, "--space-2"],
    [3, "--space-3"],
    [4, "--space-4"],
    [6, "--space-6"],
    [8, "--space-8"],
    [12, "--space-12"],
    [16, "--space-16"],
  ] as const;

  for (const [mult, name] of stepNames) {
    const value = round(baseUnit * mult);
    const observedCount = spacing.get(value) ?? 0;
    tokens.push({
      group: "spacing",
      name,
      label: `${mult}× step`,
      value: `${value}px`,
      confidence: observedCount > 0 ? "observed" : "estimated",
      evidence:
        observedCount > 0
          ? `${observedCount} declarations use ${value}px.`
          : `Derived from the ${baseUnit}px base unit.`,
      occurrences: observedCount,
    });
  }

  const sectionSpacing = spacingList.filter(([v]) => v >= 40).sort((a, b) => b[0] - a[0])[0];
  if (sectionSpacing) {
    tokens.push({
      group: "spacing",
      name: "--space-section",
      label: "Section rhythm",
      value: `${round(sectionSpacing[0])}px`,
      confidence: "observed",
      evidence: `Largest repeated padding/margin value (${sectionSpacing[1]} declarations).`,
      occurrences: sectionSpacing[1],
    });
  }

  /* ---------------- radii ---------------- */

  const radiusList = Array.from(radii.entries()).sort((a, b) => a[0] - b[0]);
  const radiusNames = ["--radius-sm", "--radius-md", "--radius-lg", "--radius-xl"];
  radiusList
    .filter(([v]) => v < 900)
    .slice(0, 4)
    .forEach(([value, count], index) => {
      tokens.push({
        group: "radius",
        name: radiusNames[index],
        label: `Corner radius ${index + 1}`,
        value: `${round(value)}px`,
        confidence: "observed",
        evidence: `${count} border-radius declarations.`,
        occurrences: count,
      });
    });
  if (radii.has(999)) {
    tokens.push({
      group: "radius",
      name: "--radius-pill",
      label: "Pill radius",
      value: "999px",
      confidence: "observed",
      evidence: "Fully rounded controls detected (50% / 999px).",
      occurrences: radii.get(999) ?? 0,
    });
  }

  /* ---------------- shadows ---------------- */

  const shadowList = Array.from(shadows.values()).sort((a, b) => b.count - a.count).slice(0, 3);
  const shadowNames = ["--shadow-sm", "--shadow-md", "--shadow-lg"];
  shadowList.forEach((shadow, index) => {
    tokens.push({
      group: "shadow",
      name: shadowNames[index],
      label: `Elevation ${index + 1}`,
      value: shadow.sample,
      confidence: "observed",
      evidence: `${shadow.count} box-shadow declarations.`,
      occurrences: shadow.count,
    });
  });

  /* ---------------- layout ---------------- */

  const widthEntry = Array.from(widths.entries()).sort((a, b) => b[1] - a[1])[0];
  if (widthEntry) {
    tokens.push({
      group: "layout",
      name: "--container-max",
      label: "Content width",
      value: widthEntry[0],
      confidence: "observed",
      evidence: `${widthEntry[1]} max-width declarations.`,
      occurrences: widthEntry[1],
    });
  }

  /* ---------------- palette for the UI ---------------- */

  const roleMap = new Map<string, string>();
  const roleOf = (name: string) => tokens.find((t) => t.name === name);
  [
    ["--color-primary", "Primary"],
    ["--color-accent", "Accent"],
    ["--color-background", "Background"],
    ["--color-surface", "Surface"],
    ["--color-text", "Text"],
    ["--color-text-muted", "Muted"],
    ["--color-border", "Border"],
    ["--color-success", "Success"],
    ["--color-danger", "Danger"],
  ].forEach(([name, label]) => {
    const token = roleOf(name);
    if (token && token.confidence !== "unknown") roleMap.set(token.value, label);
  });

  const palette: PaletteSwatch[] = merged
    .slice(0, 14)
    .map((entry) => ({
      hex: entry.hex,
      role: roleMap.get(entry.hex) ?? "Observed",
      occurrences: entry.count,
      confidence: (roleMap.has(entry.hex) ? "observed" : "estimated") as Confidence,
    }))
    .slice(0, 9);

  const darkMode = background ? rgbToHsl(background.rgb).l < 0.3 : false;

  return {
    tokens,
    palette,
    fontFamilies: familyList.map(([name]) => name).slice(0, 6),
    darkMode,
    baseUnit,
  };
}
