import * as cheerio from "cheerio";
import { safeFetchCss, safeFetchHtml } from "@/lib/security/url-guard";
import { AnalysisError } from "@/lib/errors";
import { parseCss } from "./css";
import { extractStructure } from "./structure";
import { extractTokens } from "./tokens";
import { buildComponents } from "./components";
import { generateMarkdown } from "./markdown";
import type { AnalysisResult, ReferenceInfo, SectionNode, Viewport } from "@/lib/types";

const USER_AGENT = "UIvantaBot/1.0 (+https://uivanta.app/bot; design analysis)";
const MAX_STYLESHEETS = 6;
const MAX_CSS_BYTES = 1_800_000;

export type ProgressReporter = (stage: "fetching" | "capturing" | "extracting" | "generating", progress: number, label: string) => void;

function detectStates(declarations: Array<{ selector: string; property: string }>) {
  const count = (re: RegExp) =>
    declarations.reduce((sum, d) => (re.test(d.selector) ? sum + 1 : sum), 0);
  return {
    hover: count(/:hover/),
    focus: count(/:focus/),
    active: count(/:active/),
    disabled: count(/:disabled|\[disabled\]/),
    transitions: declarations.filter((d) => d.property === "transition").length,
  };
}

async function collectCss(
  html: string,
  baseUrl: string
): Promise<{ css: string; stylesheets: number; truncated: boolean }> {
  const $ = cheerio.load(html);
  const chunks: string[] = [];
  let bytes = 0;

  $("style").each((_, el) => {
    const text = $(el).text();
    if (!text || bytes > MAX_CSS_BYTES) return;
    chunks.push(text);
    bytes += text.length;
  });

  const hrefs: string[] = [];
  $('link[rel~="stylesheet"][href]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      hrefs.push(new URL(href, baseUrl).toString());
    } catch {
      /* ignore malformed hrefs */
    }
  });

  const unique = Array.from(new Set(hrefs)).slice(0, MAX_STYLESHEETS);
  const results = await Promise.all(
    unique.map(async (href) => {
      try {
        return await safeFetchCss(href, USER_AGENT, 450_000);
      } catch {
        return null;
      }
    })
  );

  let stylesheets = 0;
  for (const css of results) {
    if (!css) continue;
    if (bytes + css.length > MAX_CSS_BYTES) break;
    chunks.push(css);
    bytes += css.length;
    stylesheets += 1;
  }

  return {
    css: chunks.join("\n\n"),
    stylesheets,
    truncated: bytes >= MAX_CSS_BYTES,
  };
}

export async function analyzeUrl(
  rawUrl: string,
  viewport: Viewport,
  report: ProgressReporter = () => {}
): Promise<AnalysisResult> {
  const started = Date.now();

  report("fetching", 12, "Loading the reference page");
  const page = await safeFetchHtml(rawUrl, USER_AGENT);
  if (!page.ok) {
    throw new AnalysisError(page.code, page.message, {
      hint: page.hint,
      retryable: ["TIMEOUT", "NETWORK_ERROR", "UPSTREAM_RATE_LIMIT"].includes(page.code),
      status: 422,
    });
  }

  report("capturing", 34, "Reading markup and stylesheets");
  const structure = extractStructure(page.html, page.finalUrl);
  const { css, stylesheets, truncated } = await collectCss(page.html, page.finalUrl);

  report("extracting", 58, "Extracting design tokens");
  const parsed = parseCss(css);
  const declarations = [...parsed.declarations, ...structure.inlineDeclarations];
  const extraction = extractTokens(declarations);
  const components = buildComponents(structure, extraction.tokens, structure.sections);

  const domain = (() => {
    try {
      return new URL(page.finalUrl).hostname.replace(/^www\./, "");
    } catch {
      return undefined;
    }
  })();

  const limitations: string[] = [
    "Values rendered by client-side JavaScript after load are not captured; the analysis reads the delivered HTML and CSS.",
    "Font names come from CSS declarations. The font files themselves were not downloaded or inspected.",
    "Only the submitted page was analysed — other routes, modals, and authenticated states are out of scope.",
    "Hover, focus, and breakpoint behaviour is inferred from stylesheet selectors, not from live interaction.",
    "Images, icons, and illustrations are counted, not downloaded or reused.",
  ];
  if (stylesheets === 0) {
    limitations.unshift(
      "No external stylesheet could be fetched, so only inline <style> blocks and style attributes contributed values. Expect gaps in the palette and type scale."
    );
  }
  if (truncated) {
    limitations.push(
      "The stylesheet exceeded the parsing budget and was truncated; rarely used values may be missing."
    );
  }
  if (structure.sections.length === 0) {
    limitations.push(
      "No landmark regions (<header>, <section>, <main>, <footer>) were found, so the page structure is inferred from headings only."
    );
  }

  let sections: SectionNode[] = structure.sections;
  if (sections.length === 0 && structure.headings.length > 0) {
    sections = structure.headings.map((h) => ({
      tag: `h${h.level}`,
      heading: h.text,
      level: h.level,
      summary: "Heading detected outside a landmark region.",
      hints: [],
    }));
  }

  const reference: ReferenceInfo = {
    kind: "url",
    url: page.finalUrl,
    domain,
    title: structure.title || domain || "Untitled page",
    description: structure.description,
    lang: structure.lang,
    favicon: structure.favicon ?? undefined,
    viewport,
    palette: extraction.palette,
    sections,
    counts: structure.counts,
    fontFaces: parsed.fontFaces,
    stylesheets,
    cssBytes: parsed.bytes,
    capturedAt: new Date().toISOString(),
    limitations,
  };

  report("generating", 82, "Writing design.md");
  const markdown = generateMarkdown({
    reference,
    tokens: extraction.tokens,
    components,
    states: detectStates(declarations),
    mediaQueries: parsed.mediaQueries,
    darkMode: extraction.darkMode,
  });

  const stats = {
    tokens: extraction.tokens.length,
    colors: extraction.palette.length,
    components: components.length,
    sections: sections.length,
    confidence: {
      observed: extraction.tokens.filter((t) => t.confidence === "observed").length,
      estimated: extraction.tokens.filter((t) => t.confidence === "estimated").length,
      unknown: extraction.tokens.filter((t) => t.confidence === "unknown").length,
    },
    durationMs: Date.now() - started,
  };

  return { reference, tokens: extraction.tokens, components, markdown, stats };
}
