import type {
  ComponentSpec,
  Confidence,
  DesignToken,
  ReferenceInfo,
  SectionNode,
  TokenGroup,
} from "@/lib/types";
import { contrastRatio, parseColor, rgbToHsl } from "./color";

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  observed: "Observed",
  estimated: "Estimated",
  unknown: "Unknown",
};

const CONFIDENCE_MARK: Record<Confidence, string> = {
  observed: "observed",
  estimated: "estimated",
  unknown: "unknown",
};

function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
}

function table(headers: string[], rows: string[][]): string {
  const head = `| ${headers.map(cell).join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map(cell).join(" | ")} |`);
  return [head, divider, ...body].join("\n");
}

function group(tokens: DesignToken[], target: TokenGroup): DesignToken[] {
  return tokens.filter((t) => t.group === target && t.confidence !== "unknown");
}

function find(tokens: DesignToken[], name: string): DesignToken | undefined {
  return tokens.find((t) => t.name === name);
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function describeDirection(
  tokens: DesignToken[],
  darkMode: boolean,
  components: ComponentSpec[]
): string {
  const bg = find(tokens, "--color-background");
  const primary = find(tokens, "--color-primary");
  const radius = find(tokens, "--radius-lg") ?? find(tokens, "--radius-md");
  const shadow = find(tokens, "--shadow-md") ?? find(tokens, "--shadow-sm");
  const font = find(tokens, "--font-sans");

  const bgRgb = bg ? parseColor(bg.value) : null;
  const hsl = bgRgb ? rgbToHsl(bgRgb) : null;

  const tone = darkMode
    ? "Dark, high-contrast interface"
    : hsl && hsl.l > 0.94
      ? "Bright, airy surface with generous whitespace"
      : hsl && hsl.l > 0.88
        ? "Warm, paper-like surface with soft separation"
        : "Mid-tone surface with contained contrast";

  const radiusPx = radius ? parseFloat(radius.value) : 0;
  const shape =
    radiusPx >= 20
      ? "soft, heavily rounded geometry"
      : radiusPx >= 10
        ? "moderately rounded corners"
        : radiusPx > 0
          ? "restrained, small-radius corners"
          : "square, structural corners";

  const depth = shadow ? "layered elevation for grouping" : "flat surfaces separated by borders";
  const accent = primary ? `anchored by a ${primary.value} accent` : "with a restrained accent colour";
  const type = font ? `Typeset in ${font.value}.` : "";
  const cardCount = components.find((c) => c.name === "Cards")?.count ?? 0;

  return `${tone}, ${shape}, ${depth}, ${accent}. ${type}${
    cardCount > 0 ? ` Content is organised into repeated card containers (${cardCount} detected).` : ""
  }`.replace(/\s+/g, " ").trim();
}

function buildCssBlock(tokens: DesignToken[]): string {
  const order: TokenGroup[] = ["color", "typography", "spacing", "radius", "shadow", "layout"];
  const headings: Record<TokenGroup, string> = {
    color: "Colour",
    typography: "Typography",
    spacing: "Spacing",
    radius: "Radii",
    shadow: "Elevation",
    layout: "Layout",
  };

  const lines: string[] = [":root {"];
  let first = true;
  for (const g of order) {
    const items = group(tokens, g);
    if (!items.length) continue;
    if (!first) lines.push("");
    first = false;
    lines.push(`  /* ${headings[g]} */`);
    const seen = new Set<string>();
    for (const token of items) {
      if (seen.has(token.name)) continue;
      seen.add(token.name);
      const needsQuotes = g === "typography" && !token.value.startsWith("--");
      const value = needsQuotes && !/^[\d.]+(px|rem|em|%)?$/.test(token.value)
        ? `"${token.value}"`
        : token.value;
      lines.push(`  ${token.name}: ${value};`);
    }
  }
  lines.push("}");
  return lines.join("\n");
}

export type MarkdownInput = {
  reference: ReferenceInfo;
  tokens: DesignToken[];
  components: ComponentSpec[];
  states: { hover: number; focus: number; active: number; disabled: number; transitions: number };
  mediaQueries: string[];
  darkMode: boolean;
};

export function generateMarkdown(input: MarkdownInput): string {
  const { reference, tokens, components, states, mediaQueries, darkMode } = input;
  const out: string[] = [];

  const colors = group(tokens, "color").filter((t) => t.name.startsWith("--color-"));
  const typeTokens = group(tokens, "typography");
  const spacing = group(tokens, "spacing");
  const radii = group(tokens, "radius");
  const shadows = group(tokens, "shadow");
  const layout = group(tokens, "layout");

  const bg = find(tokens, "--color-background");
  const text = find(tokens, "--color-text");
  const primary = find(tokens, "--color-primary");

  const observedCount = tokens.filter((t) => t.confidence === "observed").length;
  const estimatedCount = tokens.filter((t) => t.confidence === "estimated").length;
  const unknownCount = tokens.filter((t) => t.confidence === "unknown").length;

  const docTitle = reference.title || reference.domain || "Reference";
  const sourceLabel =
    reference.kind === "url" ? reference.url ?? reference.domain ?? "URL" : "Uploaded screenshot";

  out.push(`# Design System — ${docTitle}`);
  out.push("");
  out.push(
    `> Generated by **UIvanta** on ${fmtDate(reference.capturedAt)} from ${
      reference.kind === "url" ? `\`${reference.domain ?? sourceLabel}\`` : "an uploaded screenshot"
    }. ${observedCount} observed values, ${estimatedCount} estimated, ${unknownCount} unknown.`
  );
  out.push("");
  out.push(
    "> **How to use this file:** attach it to your coding agent and ask it to scaffold the page structure from §9 first, then apply the tokens in §13, then refine components from §8. Do not invent values for anything marked *Unknown* — ask instead."
  );
  out.push("");
  out.push("---");
  out.push("");

  /* ---------------------------------------------------------------- 1 */
  out.push("## 1. Project Overview");
  out.push("");
  out.push(
    table(
      ["Field", "Value"],
      [
        ["Reference", docTitle],
        ["Source", sourceLabel],
        [
          "Page purpose",
          reference.description ||
            "Not stated in the page metadata — infer from the section headings in §9.",
        ],
        [
          "Primary action",
          components.find((c) => c.name === "Buttons")?.description
            ? "Repeat the dominant call to action found in the hero region (see §8)."
            : "No button-like control was detected.",
        ],
        ["Visual direction", describeDirection(tokens, darkMode, components)],
        [
          "Analysis method",
          reference.kind === "url"
            ? "Static HTML + stylesheet extraction, plus markup structure analysis."
            : "Pixel sampling of the uploaded screenshot, plus manual visual review.",
        ],
        ["Captured at", `${fmtDate(reference.capturedAt)} · ${reference.viewport} reference`],
      ]
    )
  );
  out.push("");

  /* ---------------------------------------------------------------- 2 */
  out.push("## 2. Reference Information & Analysis Limitations");
  out.push("");
  out.push(
    table(
      ["Property", "Value"],
      [
        ["Source type", reference.kind === "url" ? "Public website URL" : "Screenshot upload"],
        ["Language", reference.lang || "unknown"],
        ["Stylesheets parsed", reference.kind === "url" ? String(reference.stylesheets) : "n/a"],
        [
          "CSS volume",
          reference.cssBytes > 0 ? `${Math.round(reference.cssBytes / 1024)} KB` : "n/a",
        ],
        ["Sections detected", String(reference.sections.length)],
        ["Headings detected", String(reference.counts.headings)],
        ["Buttons / links", `${reference.counts.buttons} / ${reference.counts.links}`],
        ["Images", String(reference.counts.images)],
      ]
    )
  );
  out.push("");
  out.push("### Confidence model");
  out.push("");
  out.push(
    "- **Observed** — the value appears literally in the reference stylesheet or pixel data.",
    "- **Estimated** — the value is inferred (role assignment, scale position, or a conventional default).",
    "- **Unknown** — no evidence was available. Never fabricate these values."
  );
  out.push("");
  if (reference.limitations.length) {
    out.push("### Limitations of this analysis");
    out.push("");
    for (const limitation of reference.limitations) out.push(`- ${limitation}`);
    out.push("");
  }

  /* ---------------------------------------------------------------- 3 */
  out.push("## 3. Design Principles");
  out.push("");
  const principles: string[] = [];
  if (reference.counts.headings > 0) {
    principles.push(
      `**Hierarchy over decoration.** The reference uses ${reference.counts.headings} headings across ${
        reference.sections.length
      } sections; a single dominant \`h1\` per view, then descending levels without skipping.`
    );
  }
  if (spacing.length) {
    const base = spacing[0];
    const section = find(tokens, "--space-section");
    principles.push(
      `**Rhythmic spacing.** A ${base.value} base unit drives component padding${
        section ? `, with ~${section.value} between major sections` : ""
      }. Keep every gap on this scale.`
    );
  }
  if (colors.length) {
    principles.push(
      `**Restrained palette.** ${colors.length} semantic colour roles cover the whole interface${
        primary ? `; ${primary.value} carries interaction` : ""
      }. New colours need a semantic reason.`
    );
  }
  if (radii.length) {
    principles.push(
      `**Consistent shape language.** ${radii.length} radius values are in use — reuse them instead of inventing intermediate corners.`
    );
  }
  principles.push(
    shadows.length
      ? `**Depth through elevation.** ${shadows.length} shadow level${shadows.length === 1 ? "" : "s"} separate surfaces; avoid mixing heavy shadows with thick borders on the same element.`
      : "**Flat surfaces.** Separation comes from borders and background contrast, not from shadows."
  );
  principles.forEach((p) => out.push(`- ${p}`));
  out.push("");

  /* ---------------------------------------------------------------- 4 */
  out.push("## 4. Color Palette");
  out.push("");
  if (colors.length) {
    out.push(
      table(
        ["Role", "Token", "Value", "Confidence", "Evidence"],
        colors.map((t) => [
          t.label,
          `\`${t.name}\``,
          `\`${t.value}\``,
          CONFIDENCE_MARK[t.confidence],
          t.evidence,
        ])
      )
    );
    out.push("");
    out.push("```css");
    out.push(":root {");
    for (const token of colors) out.push(`  ${token.name}: ${token.value};`);
    out.push("}");
    out.push("```");
    out.push("");
    out.push("### Usage rules");
    out.push("");
    if (primary) {
      out.push(
        `- \`${primary.value}\` is the interaction colour: primary buttons, active navigation, links, and focus rings. Do not use it for large background fills.`
      );
    }
    if (bg) out.push(`- \`${bg.value}\` is the page canvas. Cards sit on top using the surface token.`);
    if (text) {
      out.push(
        `- \`${text.value}\` is body copy. Secondary copy drops to the muted token, never below 4.5:1 contrast.`
      );
    }
    if (reference.palette.length) {
      out.push("");
      out.push("### Sampled swatches");
      out.push("");
      out.push(
        reference.palette
          .map((swatch) => `\`${swatch.hex}\` ${swatch.role} (${swatch.occurrences} uses)`)
          .join(" · ")
      );
    }
    out.push("");
    if (bg && text) {
      const bgRgb = parseColor(bg.value);
      const textRgb = parseColor(text.value);
      if (bgRgb && textRgb) {
        const ratio = contrastRatio(bgRgb, textRgb);
        out.push(
          `**Body contrast:** ${ratio.toFixed(2)}:1 — ${
            ratio >= 4.5
              ? "passes WCAG AA for normal text."
              : "fails WCAG AA (4.5:1). Darken the text or lighten the canvas before shipping."
          }`
        );
        out.push("");
      }
    }
  } else {
    out.push(
      "> No colour declarations were readable from this reference. Treat the palette as unknown and sample it manually before implementation."
    );
    out.push("");
  }

  /* ---------------------------------------------------------------- 5 */
  out.push("## 5. Typography");
  out.push("");
  const families = typeTokens.filter((t) => t.name.startsWith("--font-"));
  const sizes = typeTokens.filter((t) => t.name.startsWith("--text-"));
  const metrics = typeTokens.filter(
    (t) => t.name.startsWith("--weight") || t.name.startsWith("--leading")
  );

  if (families.length) {
    out.push(
      table(
        ["Role", "Token", "Family", "Confidence"],
        families.map((t) => [t.label, `\`${t.name}\``, `**${t.value}**`, CONFIDENCE_MARK[t.confidence]])
      )
    );
    out.push("");
  } else {
    out.push(
      "> Font families could not be identified from the reference. Do not guess a specific typeface — choose a close substitute and note the substitution in your implementation."
    );
    out.push("");
  }

  if (sizes.length) {
    out.push("### Type scale");
    out.push("");
    out.push(
      table(
        ["Step", "Token", "Size", "Suggested line-height", "Suggested weight"],
        sizes.map((t, index) => {
          const px = parseFloat(t.value);
          const lh = px >= 40 ? "1.05–1.1" : px >= 24 ? "1.15–1.25" : px >= 18 ? "1.4" : "1.5–1.6";
          const weight = px >= 40 ? "700–800" : px >= 24 ? "600–700" : px >= 18 ? "500–600" : "400–500";
          return [
            t.label.replace(" size", ""),
            `\`${t.name}\``,
            `\`${t.value}\``,
            `${lh} (estimated)`,
            `${weight} (estimated)`,
          ];
        })
      )
    );
    out.push("");
  }

  if (metrics.length) {
    out.push("### Metrics");
    out.push("");
    for (const token of metrics) {
      out.push(`- **${token.label}:** \`${token.value}\` — ${token.evidence}`);
    }
    out.push("");
  }

  out.push("### Typographic rules");
  out.push("");
  out.push("- Set the body size at the observed base step and never below 14px for interface copy.");
  out.push("- Tighten tracking as size increases; body copy stays at `0` letter-spacing.");
  out.push("- Limit the document to three weights: regular, medium, and one heading weight.");
  out.push("- Avoid all-caps for sentences longer than a few words; reserve it for micro-labels with added tracking.");
  out.push("");

  /* ---------------------------------------------------------------- 6 */
  out.push("## 6. Spacing & Layout");
  out.push("");
  const baseUnit = spacing[0]?.value ?? "8px";
  out.push(`- **Base unit:** \`${baseUnit}\` (derived from the most frequent padding/margin value).`);
  if (layout[0]) out.push(`- **Content width:** \`${layout[0].value}\` (observed max-width).`);
  const sectionSpace = find(tokens, "--space-section");
  if (sectionSpace) out.push(`- **Section rhythm:** \`${sectionSpace.value}\` vertical padding.`);
  out.push("- **Alignment:** left-aligned text blocks with a single shared left edge per container.");
  out.push("");
  if (spacing.length) {
    out.push(
      table(
        ["Token", "Value", "Typical use"],
        spacing.map((t) => [
          `\`${t.name}\``,
          `\`${t.value}\``,
          parseFloat(t.value) <= 8
            ? "Icon gaps, inline padding"
            : parseFloat(t.value) <= 24
              ? "Card padding, stack gaps"
              : parseFloat(t.value) <= 64
                ? "Group separation"
                : "Section padding",
        ])
      )
    );
    out.push("");
  }
  out.push(
    "**Grid:** a 12-column grid is a safe default at desktop; collapse to 8 columns at tablet and 4 at mobile. This is a structural recommendation, not an observed value."
  );
  out.push("");

  /* ---------------------------------------------------------------- 7 */
  out.push("## 7. Responsive Design Rules");
  out.push("");
  if (mediaQueries.length) {
    out.push("**Breakpoints observed in the reference stylesheet:**");
    out.push("");
    mediaQueries.slice(0, 10).forEach((mq) => out.push(`- \`@media ${mq}\``));
    out.push("");
  } else {
    out.push(
      "> No explicit media queries were found in the readable CSS. The reference may rely on utility classes, container queries, or client-side layout. Breakpoints below are recommendations."
    );
    out.push("");
  }
  out.push(
    table(
      ["Viewport", "Width", "Behaviour to implement"],
      [
        [
          "Desktop",
          "≥ 1280px",
          `Full layout at the observed container width${
            layout[0] ? ` (${layout[0].value})` : ""
          }; multi-column sections and the complete navigation visible.`,
        ],
        [
          "Tablet",
          "768–1279px",
          "Reduce to two columns, keep section padding but trim horizontal gutters to 32px, collapse secondary navigation.",
        ],
        [
          "Mobile",
          "< 768px",
          "Single column, 20px gutters, stack hero media below the headline, convert navigation to a disclosure menu, keep tap targets ≥ 44px.",
        ],
      ]
    )
  );
  out.push("");
  out.push(
    "- Never hide essential content to make a breakpoint fit — reflow it instead.",
    "- Test at 375, 768, 1024, and 1440px; confirm no horizontal scrolling at any width."
  );
  out.push("");

  /* ---------------------------------------------------------------- 8 */
  out.push("## 8. Component Specifications");
  out.push("");
  if (components.length) {
    for (const component of components) {
      out.push(`### ${component.name}`);
      out.push("");
      out.push(component.description);
      out.push("");
      out.push(
        table(
          ["Property", "Value", "Confidence"],
          component.properties.map((p) => [p.label, p.value, CONFIDENCE_MARK[p.confidence]])
        )
      );
      out.push("");
    }
  } else {
    out.push(
      "> No reusable components could be identified from this reference. Describe components manually before implementation."
    );
    out.push("");
  }

  /* ---------------------------------------------------------------- 9 */
  out.push("## 9. Page Structure & Hierarchy");
  out.push("");
  if (reference.sections.length) {
    out.push("**Section order (top to bottom):**");
    out.push("");
    reference.sections.forEach((section: SectionNode, index) => {
      const heading = section.heading ? `**${section.heading}**` : `_untitled ${section.tag}_`;
      out.push(`${index + 1}. \`<${section.tag}>\` — ${heading}`);
      if (section.summary) out.push(`   ${section.summary}`);
      if (section.hints.length) out.push(`   Components: ${section.hints.join(", ")}`);
    });
    out.push("");
  } else {
    out.push("> Page structure could not be read from this reference.");
    out.push("");
  }
  out.push(
    "**Implementation order:** header → hero → primary content sections → supporting content → footer. Build the shell first, then fill sections one at a time."
  );
  out.push("");

  /* ---------------------------------------------------------------- 10 */
  out.push("## 10. Interaction & State Specifications");
  out.push("");
  const stateRows: string[][] = [
    [
      "Hover",
      states.hover > 0 ? `${states.hover} hover rules observed` : "Not observed",
      states.hover > 0
        ? "Reuse the observed transition timing; change background or border, not layout."
        : "Apply a subtle surface shift (~4% darken) over 150–200ms.",
    ],
    [
      "Focus",
      states.focus > 0 ? `${states.focus} focus rules observed` : "Not observed",
      "Always visible: 2px ring in the primary colour with a 2–3px offset. Never remove the outline.",
    ],
    [
      "Active",
      states.active > 0 ? `${states.active} active rules observed` : "Not observed",
      "1px downward translate or a slightly darker fill to confirm the press.",
    ],
    [
      "Disabled",
      states.disabled > 0 ? `${states.disabled} disabled rules observed` : "Not observed",
      "Reduce opacity to 0.5, keep the label readable, and set cursor: not-allowed.",
    ],
    [
      "Loading",
      "Not observable from static analysis",
      "Use a skeleton that matches the final layout, or disable the trigger and show a spinner inside it.",
    ],
  ];
  out.push(table(["State", "Evidence", "Specification"], stateRows));
  out.push("");
  if (states.transitions > 0) {
    out.push(
      `**Motion:** ${states.transitions} transition declarations were found. Match that timing (typically 150–250ms) and honour \`prefers-reduced-motion\`.`
    );
    out.push("");
  } else {
    out.push(
      "**Motion:** no transition declarations were readable. Keep interactions to 150–250ms ease-out and honour `prefers-reduced-motion`."
    );
    out.push("");
  }

  /* ---------------------------------------------------------------- 11 */
  out.push("## 11. Assets & Image Placement");
  out.push("");
  out.push(
    `- **Images detected:** ${reference.counts.images}${
      reference.counts.images > 0
        ? " — preserve aspect ratio and surrounding whitespace rather than the exact asset."
        : " — the reference is largely typographic."
    }`
  );
  out.push(
    "- **Decorative graphics:** reproduce the *role* (hero illustration, product shot, texture) with your own assets. Do not copy protected brand artwork."
  );
  out.push(
    "- **Icons:** use a single SVG set at a consistent stroke width (1.5–2px) and size (16/20/24px). Never use emoji as interface icons."
  );
  out.push(
    "- **Optimisation:** serve WebP/AVIF, set explicit width and height, and lazy-load everything below the first viewport."
  );
  out.push("");

  /* ---------------------------------------------------------------- 12 */
  out.push("## 12. Accessibility Requirements");
  out.push("");
  const a11y: string[] = [];
  if (bg && text) {
    const bgRgb = parseColor(bg.value);
    const textRgb = parseColor(text.value);
    if (bgRgb && textRgb) {
      const ratio = contrastRatio(bgRgb, textRgb);
      a11y.push(
        `Body text contrast is ${ratio.toFixed(2)}:1 — ${
          ratio >= 4.5 ? "meets" : "does not meet"
        } WCAG AA (4.5:1).`
      );
    }
  }
  if (primary && bg) {
    const p = parseColor(primary.value);
    const b = parseColor(bg.value);
    if (p && b) {
      const ratio = contrastRatio(p, b);
      a11y.push(
        `Primary colour against the canvas measures ${ratio.toFixed(2)}:1 — ${
          ratio >= 3 ? "acceptable for large text and UI boundaries" : "below 3:1, so pair it with a darker text colour"
        }.`
      );
    }
  }
  a11y.push(
    "One `h1` per page; heading levels must not skip. Landmarks: `header`, `nav`, `main`, `footer`."
  );
  a11y.push(
    "Every interactive element reachable by keyboard, with a visible focus indicator and a logical tab order."
  );
  a11y.push(
    "Icon-only controls need an `aria-label`; decorative SVG needs `aria-hidden=\"true\"`."
  );
  a11y.push(
    "Form fields require a persistent visible label, not a placeholder, and errors described next to the field with `aria-describedby`."
  );
  a11y.push(
    "Respect `prefers-reduced-motion` for every entrance, parallax, and hover animation."
  );
  a11y.forEach((line) => out.push(`- ${line}`));
  out.push("");

  /* ---------------------------------------------------------------- 13 */
  out.push("## 13. Implementation Guidelines");
  out.push("");
  out.push("### Design tokens");
  out.push("");
  out.push("```css");
  out.push(buildCssBlock(tokens));
  out.push("```");
  out.push("");
  out.push("### Component map");
  out.push("");
  out.push(
    table(
      ["Component", "Instances", "Suggested file"],
      components.map((c) => [
        c.name,
        String(c.count),
        `<${c.name.replace(/[^a-zA-Z]/g, "")} />`,
      ])
    )
  );
  out.push("");
  out.push("### Build order");
  out.push("");
  out.push("1. Create the token layer (CSS variables or `@theme`) exactly as listed above.");
  out.push("2. Build primitives: container, stack, button, input, card.");
  out.push("3. Compose sections in the order given in §9.");
  out.push("4. Add responsive rules from §7, then interaction states from §10.");
  out.push("5. Audit contrast, focus, and keyboard behaviour before shipping.");
  out.push("");
  out.push("### Consistency rules");
  out.push("");
  out.push("- No raw hex values in components — reference tokens only.");
  out.push("- No arbitrary spacing values; snap to the scale.");
  out.push("- One button variant per intent (primary, secondary, ghost).");
  out.push("- Keep the same radius family across buttons, inputs, and cards.");
  out.push("");

  /* ---------------------------------------------------------------- 14 */
  out.push("## 14. Design Constraints & Anti-Patterns");
  out.push("");
  out.push("### Observed properties (safe to implement literally)");
  out.push("");
  const observed = tokens.filter((t) => t.confidence === "observed").slice(0, 24);
  observed.forEach((t) => out.push(`- \`${t.name}: ${t.value}\``));
  out.push("");
  out.push("### Estimated properties (verify visually before trusting)");
  out.push("");
  const estimated = tokens.filter((t) => t.confidence === "estimated");
  if (estimated.length) {
    estimated.forEach((t) => out.push(`- \`${t.name}: ${t.value}\` — ${t.evidence}`));
  } else {
    out.push("- None recorded.");
  }
  out.push("");
  out.push("### Unknown properties (do not invent)");
  out.push("");
  const unknowns = [
    reference.kind === "url"
      ? "Rendered hover/focus visuals that require JavaScript"
      : "Typography, spacing, and component geometry (screenshot only)",
    "Animation timing, easing curves, and scroll behaviour",
    "Authenticated, personalised, or A/B-tested variants",
    "Exact asset files, icon sets, and licensing",
  ];
  unknowns.forEach((u) => out.push(`- ${u}`));
  out.push("");
  out.push("### Anti-patterns to avoid");
  out.push("");
  [
    "Copying brand assets, logos, or proprietary illustrations.",
    "Mixing flat and elevated surfaces on the same hierarchy level.",
    "Introducing a new colour or radius for a single component.",
    "Centring long paragraphs or setting body copy below 14px.",
    "Removing focus outlines or relying on hover alone for affordances.",
    "Hard-coding breakpoint-specific pixel widths instead of fluid containers.",
  ].forEach((a) => out.push(`- ${a}`));
  out.push("");
  out.push("---");
  out.push("");
  out.push(
    `_Generated by UIvanta · ${observedCount} observed · ${estimatedCount} estimated · ${unknownCount} unknown · ${titleCase(
      reference.kind === "url" ? "url analysis" : "screenshot analysis"
    )}_`
  );
  out.push("");

  return out.join("\n");
}
