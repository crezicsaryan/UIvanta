# UIvanta — AI Website Design Analyzer & `design.md` Generator

UIvanta analyzes a website **URL** or an uploaded **screenshot** and produces a structured,
downloadable `design.md` file: design tokens, component specs, layout rules, accessibility
notes, and a confidence model — ready to hand to a coding agent.

> **No sign-up, no login.** The product is fully anonymous and client-side-safe. Uploaded
> screenshots are color-sampled **in the browser** (Canvas) and only the resulting palette
> leaves the device; raw images are never uploaded.

---

## What it does

1. **URL mode** — fetches the page HTML + linked CSS (with SSRF-hardened fetching), parses
   the DOM and stylesheets, and extracts a design system.
2. **Screenshot mode** — samples the dominant colors of an uploaded image in the browser and
   builds a color-led `design.md`.
3. **Output** — a deterministic 14-section Markdown document with a per-token confidence model
   (`observed` / `estimated` / `unknown`) so an agent never fabricates values it couldn't see.

### The 14 sections of `design.md`
1. Project Overview · 2. Reference Info & Limitations · 3. Design Principles · 4. Color Palette
· 5. Typography · 6. Spacing & Layout · 7. Responsive Rules · 8. Component Specs
· 9. Page Structure · 10. Interaction & State Specs · 11. Assets & Image Placement
· 12. Accessibility · 13. Implementation Guidelines · 14. Constraints & Anti-Patterns

### Confidence model
- **Observed** — value appears literally in the reference CSS or sampled pixels.
- **Estimated** — inferred (role assignment, scale position, or a conventional default).
- **Unknown** — no evidence available; the doc explicitly tells the agent *not* to invent these.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000  (or PORT=3100 npm run dev -- -p 3100)
npm run build        # production build
npm start            # serve the production build
```

Requires Node.js 22+.

---

## Architecture

| Layer | Path | Notes |
| --- | --- | --- |
| Design system | `src/app/globals.css` | `@theme` tokens (paper/ink/blue/violet/mint/rose), Tailwind v4, keyframes, reduced-motion |
| Types | `src/lib/types.ts` | `DesignToken`, `ComponentSpec`, `AnalysisJob`, `AnalysisResult`, … |
| SSRF guard | `src/lib/security/url-guard.ts` | scheme allow-list, private-IP deny-list, DNS resolution + classification, redirect re-validation, post-fetch DNS-rebinding check, byte/time caps |
| Analyzers | `src/lib/analyzer/*` | `color.ts`, `css.ts` (custom CSS parser), `tokens.ts`, `structure.ts` (Cheerio), `components.ts`, `markdown.ts`, `url.ts`, `screenshot.ts` |
| Job store | `src/lib/store.ts` | in-memory, `globalThis` singleton, rate limit (12/10 min per key), 2 h retention |
| Client palette | `src/lib/client/palette.ts` | Canvas color quantization (4-bit buckets, merge close colors) |
| API | `src/app/api/analyses/*` | POST analyze · screenshot · GET status/result · PATCH edits · GET export · POST regenerate |
| UI | `src/app/page.tsx` (landing), `analyze`, `analysis/[id]`, `privacy`, `terms` | 3D-shape template aesthetic, Lucide icons, react-markdown preview |

### API endpoints
| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/analyses` | Start URL analysis → `202 {id}` |
| POST | `/api/analyses/screenshot` | Start screenshot analysis (palette payload) → `202 {id}` |
| GET | `/api/analyses/[id]` | Job status / progress |
| GET | `/api/analyses/[id]/result` | Result + tokens + markdown |
| PATCH | `/api/analyses/[id]/result` | Save user edits to the markdown |
| GET | `/api/analyses/[id]/export` | Download `design.md` (`text/markdown`, attachment) |
| POST | `/api/analyses/[id]/regenerate` | Re-run analysis |

---

## Security notes
- URL fetching is SSRF-hardened: only `http`/`https`, private/loopback/link-local/metadata IP
  ranges are blocked, DNS is resolved and classified before connecting, redirects are
  re-validated, and a post-request DNS-rebinding check compares the connected host's IP against
  the resolved IP.
- Screenshot pixels are never sent to the server — only the quantized palette (≤24 swatches).
- HTML/CSS fetch is capped by byte size and time; stylesheets are parsed with a custom,
  allocation-bounded parser (no native CSSOM).

---

## Phased delivery (per PRD/TRD)
- **Phase 1 — Foundation & design system** (Tailwind v4 tokens, fonts, shapes, layout)
- **Phase 2 — Landing page** (Hero, How-it-works, Sample output, Features, Confidence, FAQ, CTA)
- **Phase 3 — Analysis engine** (color/typography/spacing/component extraction + confidence)
- **Phase 4 — API & job pipeline** (rate-limited, in-memory, progress stages, export)
- **Phase 5 — Analysis & results workspace** (polling UI, token grid, MD preview/edit/copy/download, regenerate, retry)
- **Phase 6 — QA, build & handoff** (typecheck, build, responsive/keyboard/contrast checks)

## Known limitations (MVP)
- Screenshot mode captures color only — typography, spacing, and component geometry are marked
  *Unknown* by design.
- Analysis is static (no headless rendering), so JS-injected styles and hover/scroll states are
  not observed.
- In-memory job store: jobs live for ~2 h and are lost on server restart.
