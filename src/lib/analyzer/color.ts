export type RGB = { r: number; g: number; b: number; a: number };

const NAMED: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  navy: "#000080",
  teal: "#008080",
  purple: "#800080",
  orange: "#ffa500",
  yellow: "#ffff00",
  pink: "#ffc0cb",
  brown: "#a52a2a",
  gold: "#ffd700",
  beige: "#f5f5dc",
  ivory: "#fffff0",
  lavender: "#e6e6fa",
  coral: "#ff7f50",
  salmon: "#fa8072",
  crimson: "#dc143c",
  indigo: "#4b0082",
  violet: "#ee82ee",
  turquoise: "#40e0d0",
  magenta: "#ff00ff",
  maroon: "#800000",
  olive: "#808000",
  lime: "#00ff00",
  aqua: "#00ffff",
  cyan: "#00ffff",
  fuchsia: "#ff00ff",
  transparent: "#00000000",
};

function clamp(n: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, n));
}

function hueToRgb(p: number, q: number, t: number) {
  let x = t;
  if (x < 0) x += 1;
  if (x > 1) x -= 1;
  if (x < 1 / 6) return p + (q - p) * 6 * x;
  if (x < 1 / 2) return q;
  if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
  return p;
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hue = ((h % 360) + 360) % 360 / 360;
  const sat = clamp(s, 0, 1);
  const light = clamp(l, 0, 1);
  if (sat === 0) {
    const v = Math.round(light * 255);
    return { r: v, g: v, b: v };
  }
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  return {
    r: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hue) * 255),
    b: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  };
}

export function parseColor(raw: string): RGB | null {
  const input = raw.trim().toLowerCase();
  if (!input) return null;
  if (input === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (input === "currentcolor" || input === "inherit" || input === "initial" || input === "unset") {
    return null;
  }
  if (input.startsWith("var(")) return null;

  if (NAMED[input]) return parseColor(NAMED[input]);

  const hex = /^#([0-9a-f]{3,8})$/.exec(input);
  if (hex) {
    const v = hex[1];
    if (v.length === 3 || v.length === 4) {
      return {
        r: parseInt(v[0] + v[0], 16),
        g: parseInt(v[1] + v[1], 16),
        b: parseInt(v[2] + v[2], 16),
        a: v.length === 4 ? parseInt(v[3] + v[3], 16) / 255 : 1,
      };
    }
    if (v.length === 6 || v.length === 8) {
      return {
        r: parseInt(v.slice(0, 2), 16),
        g: parseInt(v.slice(2, 4), 16),
        b: parseInt(v.slice(4, 6), 16),
        a: v.length === 8 ? parseInt(v.slice(6, 8), 16) / 255 : 1,
      };
    }
    return null;
  }

  const rgbMatch = /^rgba?\(([^)]+)\)$/.exec(input);
  if (rgbMatch) {
    const parts = rgbMatch[1]
      .replace(/\//g, " ")
      .split(/[,\s]+/)
      .filter(Boolean);
    if (parts.length < 3) return null;
    const channel = (p: string) =>
      p.endsWith("%") ? Math.round((parseFloat(p) / 100) * 255) : parseFloat(p);
    const r = channel(parts[0]);
    const g = channel(parts[1]);
    const b = channel(parts[2]);
    let a = 1;
    if (parts[3] !== undefined) {
      a = parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    }
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r: clamp(r), g: clamp(g), b: clamp(b), a: Number.isFinite(a) ? clamp(a, 0, 1) : 1 };
  }

  const hslMatch = /^hsla?\(([^)]+)\)$/.exec(input);
  if (hslMatch) {
    const parts = hslMatch[1].replace(/\//g, " ").split(/[,\s]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    if ([h, s, l].some((n) => Number.isNaN(n))) return null;
    const { r, g, b } = hslToRgb(h, s, l);
    const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
    return { r, g, b, a: Number.isFinite(a) ? clamp(a, 0, 1) : 1 };
  }

  return null;
}

export function toHex(color: RGB): string {
  const h = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, "0");
  return `#${h(color.r)}${h(color.g)}${h(color.b)}`.toUpperCase();
}

export function rgbToHsl(color: RGB): { h: number; s: number; l: number } {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

export function relativeLuminance(color: RGB): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

export function isNeutral(color: RGB): boolean {
  const { s, l } = rgbToHsl(color);
  return s < 0.1 || l < 0.08 || l > 0.96;
}

export function isNear(a: RGB, b: RGB, tolerance = 12): boolean {
  return (
    Math.abs(a.r - b.r) <= tolerance &&
    Math.abs(a.g - b.g) <= tolerance &&
    Math.abs(a.b - b.b) <= tolerance
  );
}

/** Find every colour literal inside a CSS value. */
export function findColorLiterals(value: string): string[] {
  const results: string[] = [];
  const re =
    /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:black|white|transparent|currentColor)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value))) {
    results.push(match[0]);
  }
  return results;
}
