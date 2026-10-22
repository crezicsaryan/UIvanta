export type Declaration = {
  selector: string;
  property: string;
  value: string;
  custom: boolean;
};

export type ParsedCss = {
  declarations: Declaration[];
  fontFaces: string[];
  mediaQueries: string[];
  bytes: number;
  truncated: boolean;
};

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, " ");
}

/** Split a declaration block on semicolons that are not inside quotes or parens. */
export function splitDeclarations(body: string): string[] {
  const out: string[] = [];
  let current = "";
  let quote: string | null = null;
  let depth = 0;

  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (quote) {
      current += char;
      if (char === quote && body[i - 1] !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "(") depth++;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === ";" && depth === 0) {
      if (current.trim()) out.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

function splitProperty(entry: string): { property: string; value: string } | null {
  const index = entry.indexOf(":");
  if (index <= 0) return null;
  const property = entry.slice(0, index).trim().toLowerCase();
  const value = entry
    .slice(index + 1)
    .replace(/!important/gi, "")
    .trim();
  if (!property || !value) return null;
  return { property, value };
}

export function parseCss(css: string, maxDeclarations = 30_000): ParsedCss {
  const cleaned = stripComments(css);
  const declarations: Declaration[] = [];
  const fontFaces: string[] = [];
  const mediaQueries: string[] = [];
  let truncated = false;

  // @font-face families
  const fontFaceRe = /@font-face\s*\{([^}]*)\}/gi;
  let ff: RegExpExecArray | null;
  while ((ff = fontFaceRe.exec(cleaned))) {
    const family = /font-family\s*:\s*([^;]+)/i.exec(ff[1])?.[1]?.trim().replace(/['"]/g, "");
    if (family) fontFaces.push(family);
  }

  // @media preludes (responsive evidence)
  const mediaRe = /@media([^{]+)\{/gi;
  let mq: RegExpExecArray | null;
  while ((mq = mediaRe.exec(cleaned))) {
    const prelude = mq[1].replace(/\s+/g, " ").trim();
    if (prelude) mediaQueries.push(prelude);
    if (mediaQueries.length >= 40) break;
  }

  // Rule blocks. This matches innermost blocks, which is what we want for tokens.
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  let block: RegExpExecArray | null;
  while ((block = blockRe.exec(cleaned))) {
    const selector = block[1].replace(/\s+/g, " ").trim();
    const body = block[2];
    if (!selector || selector.startsWith("@")) continue;

    for (const entry of splitDeclarations(body)) {
      if (declarations.length >= maxDeclarations) {
        truncated = true;
        break;
      }
      const parsed = splitProperty(entry);
      if (!parsed) continue;
      declarations.push({
        selector,
        property: parsed.property,
        value: parsed.value,
        custom: parsed.property.startsWith("--"),
      });
    }
    if (truncated) break;
  }

  return {
    declarations,
    fontFaces: Array.from(new Set(fontFaces)).slice(0, 12),
    mediaQueries: Array.from(new Set(mediaQueries)),
    bytes: css.length,
    truncated,
  };
}

/** Pull inline `style="..."` attributes into the same shape. */
export function parseInlineStyle(style: string, selector = "[inline-style]"): Declaration[] {
  return splitDeclarations(style)
    .map(splitProperty)
    .filter((v): v is { property: string; value: string } => Boolean(v))
    .map((v) => ({
      selector,
      property: v.property,
      value: v.value,
      custom: v.property.startsWith("--"),
    }));
}
