import type { ComponentSpec, DesignToken, ReferenceCounts, SectionNode } from "@/lib/types";
import type { StructureResult } from "./structure";

function value(tokens: DesignToken[], name: string): string | null {
  return tokens.find((t) => t.name === name)?.value ?? null;
}

export function buildComponents(
  structure: StructureResult,
  tokens: DesignToken[],
  sections: SectionNode[]
): ComponentSpec[] {
  const components: ComponentSpec[] = [];
  const counts: ReferenceCounts = structure.counts;

  const radius = value(tokens, "--radius-lg") ?? value(tokens, "--radius-md") ?? value(tokens, "--radius-sm");
  const pill = value(tokens, "--radius-pill");
  const primary = value(tokens, "--color-primary");
  const border = value(tokens, "--color-border");
  const shadow = value(tokens, "--shadow-md") ?? value(tokens, "--shadow-sm");
  const fontSans = value(tokens, "--font-sans");

  if (counts.navLinks > 0) {
    const navSection = sections.find((s) => s.tag === "nav" || s.tag === "header");
    components.push({
      name: "Navigation",
      count: counts.navLinks,
      observed: true,
      description: `${counts.navLinks} navigation link${counts.navLinks === 1 ? "" : "s"} found in the header region${
        navSection?.heading ? `, anchored by “${navSection.heading}”` : ""
      }. Reproduce the same link count and ordering before adjusting spacing.`,
      properties: [
        { label: "Link count", value: String(counts.navLinks), confidence: "observed" },
        {
          label: "Typeface",
          value: fontSans ?? "not declared",
          confidence: fontSans ? "observed" : "unknown",
        },
        {
          label: "Text colour",
          value: value(tokens, "--color-text") ?? "not declared",
          confidence: "observed",
        },
        {
          label: "Mobile pattern",
          value: "Not observable from static markup — assume a disclosure menu under 768px",
          confidence: "estimated",
        },
      ],
    });
  }

  if (counts.buttons > 0) {
    const labels = structure.ctaLabels.slice(0, 3);
    components.push({
      name: "Buttons",
      count: counts.buttons,
      observed: true,
      description: `${counts.buttons} button-like control${counts.buttons === 1 ? "" : "s"} detected${
        labels.length ? `, including “${labels.join("”, “")}”` : ""
      }. The primary fill is reused for every call to action.`,
      properties: [
        {
          label: "Fill",
          value: primary ?? "not declared",
          confidence: primary ? "observed" : "unknown",
        },
        {
          label: "Radius",
          value: pill ?? radius ?? "not declared",
          confidence: pill || radius ? "observed" : "unknown",
        },
        {
          label: "Label style",
          value: "Medium weight, sentence case, no letter-spacing",
          confidence: "estimated",
        },
        {
          label: "Minimum target",
          value: "44 × 44px including padding",
          confidence: "estimated",
        },
      ],
    });
  }

  if (counts.cards > 0) {
    const repeated = structure.repeatedClasses[0];
    components.push({
      name: "Cards",
      count: counts.cards,
      observed: true,
      description: `Repeated content containers detected${
        repeated ? ` (most common pattern: \`.${repeated.name}\`, ${repeated.count} instances)` : ""
      }. Use a single card component with a size modifier instead of one-off styles.`,
      properties: [
        {
          label: "Radius",
          value: radius ?? "not declared",
          confidence: radius ? "observed" : "unknown",
        },
        {
          label: "Border",
          value: border ? `1px solid ${border}` : "not declared",
          confidence: border ? "observed" : "unknown",
        },
        {
          label: "Elevation",
          value: shadow ?? "flat (no box-shadow observed)",
          confidence: shadow ? "observed" : "observed",
        },
        {
          label: "Internal padding",
          value: value(tokens, "--space-4") ?? "not declared",
          confidence: "estimated",
        },
      ],
    });
  }

  if (counts.inputs > 0 || counts.forms > 0) {
    components.push({
      name: "Forms & inputs",
      count: Math.max(counts.inputs, counts.forms),
      observed: true,
      description: `${counts.inputs} input control${counts.inputs === 1 ? "" : "s"} across ${counts.forms} form${
        counts.forms === 1 ? "" : "s"
      }. Field height and border treatment should be shared across every input type.`,
      properties: [
        {
          label: "Border",
          value: border ? `1px solid ${border}` : "not declared",
          confidence: border ? "observed" : "unknown",
        },
        {
          label: "Radius",
          value: radius ?? "not declared",
          confidence: radius ? "observed" : "unknown",
        },
        {
          label: "Field height",
          value: "48–56px",
          confidence: "estimated",
        },
        {
          label: "Focus treatment",
          value: "Visible ring using the primary colour, never outline: none",
          confidence: "estimated",
        },
      ],
    });
  }

  if (counts.footerLinks > 0) {
    components.push({
      name: "Footer",
      count: counts.footerLinks,
      observed: true,
      description: `${counts.footerLinks} footer link${counts.footerLinks === 1 ? "" : "s"} in the closing region. Group them into columns that collapse to a single stack on mobile.`,
      properties: [
        {
          label: "Link colour",
          value: value(tokens, "--color-text-muted") ?? value(tokens, "--color-text") ?? "not declared",
          confidence: "observed",
        },
        {
          label: "Divider",
          value: border ? `1px solid ${border}` : "not declared",
          confidence: border ? "observed" : "unknown",
        },
      ],
    });
  }

  const badgeClass = structure.repeatedClasses.find((c) => /badge|chip|tag|pill|label/i.test(c.name));
  if (badgeClass) {
    components.push({
      name: "Badges & labels",
      count: badgeClass.count,
      observed: true,
      description: `Small status labels detected via \`.${badgeClass.name}\` (${badgeClass.count} instances). Keep them on a single pill radius and uppercase micro-type.`,
      properties: [
        { label: "Radius", value: pill ?? "999px", confidence: pill ? "observed" : "estimated" },
        {
          label: "Text size",
          value: value(tokens, "--text-xs") ?? value(tokens, "--text-sm") ?? "12px",
          confidence: "estimated",
        },
      ],
    });
  }

  if (counts.images > 0) {
    components.push({
      name: "Media",
      count: counts.images,
      observed: true,
      description: `${counts.images} image element${counts.images === 1 ? "" : "s"}. Preserve the aspect ratio and the surrounding whitespace rather than the exact asset.`,
      properties: [
        {
          label: "Radius",
          value: radius ?? "not declared",
          confidence: radius ? "observed" : "unknown",
        },
        {
          label: "Aspect handling",
          value: "object-fit: cover with a reserved aspect-ratio box",
          confidence: "estimated",
        },
      ],
    });
  }

  return components;
}
