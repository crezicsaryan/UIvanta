import * as cheerio from "cheerio";
import type { Declaration } from "./css";
import { parseInlineStyle } from "./css";
import type { ReferenceCounts, SectionNode } from "@/lib/types";

const COMPONENT_WORDS = [
  "nav",
  "navbar",
  "header",
  "hero",
  "button",
  "btn",
  "card",
  "tile",
  "panel",
  "form",
  "input",
  "field",
  "search",
  "table",
  "list",
  "grid",
  "badge",
  "chip",
  "tag",
  "avatar",
  "icon",
  "modal",
  "dialog",
  "accordion",
  "tab",
  "carousel",
  "slider",
  "testimonial",
  "pricing",
  "footer",
  "sidebar",
  "menu",
  "dropdown",
  "banner",
  "cta",
];

const CARD_RE = /(card|tile|panel|item|product|post|feature|testimonial|pricing|blog)/i;

function clean(text: string, max = 160): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

export type StructureResult = {
  title: string;
  description: string;
  lang: string;
  favicon: string | null;
  sections: SectionNode[];
  counts: ReferenceCounts;
  inlineDeclarations: Declaration[];
  repeatedClasses: Array<{ name: string; count: number }>;
  ctaLabels: string[];
  headings: Array<{ level: number; text: string }>;
};

export function extractStructure(html: string, baseUrl: string): StructureResult {
  const $ = cheerio.load(html);

  const title =
    clean($("title").first().text(), 120) ||
    clean($('meta[property="og:title"]').attr("content") ?? "", 120) ||
    clean($("h1").first().text(), 120);

  const description =
    clean($('meta[name="description"]').attr("content") ?? "", 220) ||
    clean($('meta[property="og:description"]').attr("content") ?? "", 220) ||
    clean($("p").first().text(), 220);

  const lang = $("html").attr("lang") ?? "unknown";

  let favicon: string | null = null;
  const iconHref =
    $('link[rel="icon"]').attr("href") ??
    $('link[rel="shortcut icon"]').attr("href") ??
    $('link[rel="apple-touch-icon"]').attr("href");
  if (iconHref) {
    try {
      favicon = new URL(iconHref, baseUrl).toString();
    } catch {
      favicon = null;
    }
  }

  /* ---------- sections ---------- */
  const sections: SectionNode[] = [];
  const sectionTags = "header, nav, main, section, article, aside, footer";
  $(sectionTags).each((_, el) => {
    if (sections.length >= 16) return;
    const node = $(el);
    const tag = el.tagName.toLowerCase();
    const headingEl = node.find("h1, h2, h3, h4").first();
    const heading = headingEl.length ? clean(headingEl.text(), 90) : null;
    const levelText = headingEl.length ? headingEl.get(0)?.tagName?.toLowerCase() : null;
    const level = levelText ? Number(levelText.replace("h", "")) : null;
    const paragraph = clean(node.find("p").first().text(), 150);
    const classes = (node.attr("class") ?? "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const hints = Array.from(
      new Set(
        classes
          .map((c) => COMPONENT_WORDS.find((w) => c.includes(w)))
          .filter((v): v is string => Boolean(v))
      )
    ).slice(0, 4);

    const childSections = node.find("section").length;
    const summary =
      paragraph ||
      (childSections > 1 ? `${childSections} nested sections` : "") ||
      (node.find("img").length > 2 ? `${node.find("img").length} images` : "") ||
      "No readable copy inside this region.";

    // Skip anonymous wrappers that add no information.
    if (!heading && !paragraph && hints.length === 0 && sections.length > 0) return;

    sections.push({ tag, heading, level, summary, hints });
  });

  /* ---------- counts ---------- */
  const counts: ReferenceCounts = {
    sections: $("section").length,
    headings: $("h1, h2, h3, h4, h5, h6").length,
    buttons: $(
      'button, [role="button"], input[type="submit"], input[type="button"], a[class*="btn"]'
    ).length,
    links: $("a[href]").length,
    images: $("img").length,
    inputs: $("input:not([type=hidden]), select, textarea").length,
    cards: 0,
    forms: $("form").length,
    navLinks: $("nav a[href], header a[href]").length,
    footerLinks: $("footer a[href]").length,
  };

  /* ---------- repeated classes (component candidates) ---------- */
  const classCounts = new Map<string, number>();
  $("div, article, li, section, a").each((_, el) => {
    const cls = (el.attribs?.class ?? "").toLowerCase();
    if (!cls) return;
    for (const token of cls.split(/\s+/)) {
      if (!CARD_RE.test(token)) continue;
      if (token.length > 40) continue;
      classCounts.set(token, (classCounts.get(token) ?? 0) + 1);
    }
  });

  const repeatedClasses = Array.from(classCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  counts.cards = repeatedClasses.reduce((sum, entry) => sum + entry.count, 0);

  /* ---------- CTA labels ---------- */
  const ctaLabels: string[] = [];
  $('button, [role="button"], a[class*="btn"], a[class*="button"]').each((_, el) => {
    if (ctaLabels.length >= 8) return;
    const label = clean($(el).text(), 40);
    if (label && label.length > 1 && !ctaLabels.includes(label)) ctaLabels.push(label);
  });

  /* ---------- heading outline ---------- */
  const headings: Array<{ level: number; text: string }> = [];
  $("h1, h2, h3, h4").each((_, el) => {
    if (headings.length >= 20) return;
    const text = clean($(el).text(), 90);
    if (!text) return;
    headings.push({ level: Number(el.tagName.replace("h", "")), text });
  });

  /* ---------- inline styles ---------- */
  const inlineDeclarations: Declaration[] = [];
  $("[style]").each((_, el) => {
    if (inlineDeclarations.length > 1500) return;
    const style = el.attribs?.style;
    if (!style) return;
    const tag = el.tagName?.toLowerCase() ?? "element";
    const cls = (el.attribs?.class ?? "").split(/\s+/).filter(Boolean)[0];
    inlineDeclarations.push(...parseInlineStyle(style, cls ? `.${cls}` : tag));
  });

  return {
    title,
    description,
    lang,
    favicon,
    sections,
    counts,
    inlineDeclarations,
    repeatedClasses,
    ctaLabels,
    headings,
  };
}
