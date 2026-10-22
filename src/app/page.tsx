import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  CircleDashed,
  FileCode2,
  Gauge,
  Layers,
  MousePointerClick,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Type,
  Wand2,
} from "lucide-react";
import { AnalyzeForm } from "@/components/analyze-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DeveloperSection } from "@/components/developer-section";
import { HeroShapes, ShapeCluster } from "@/components/shapes";

const TOKEN_STRIP = [
  "--color-primary: #3A2FE8",
  "--radius-card: 24px",
  "--text-h1: 56px",
  "--space-section: 96px",
  "--font-display: Gilroy",
  "--shadow-md: 0 18px 40px -24px",
  "--color-mint: #4FDEC0",
  "--container-max: 1200px",
  "--weight-heading: 800",
  "--radius-pill: 999px",
];

const STEPS = [
  {
    number: "01",
    title: "Point at a reference",
    body: "Paste any public URL, or drop a screenshot when a page is behind a login, a paywall, or a canvas. Both routes end in the same structured model.",
    icon: MousePointerClick,
  },
  {
    number: "02",
    title: "We read the design",
    body: "UIvanta parses the delivered markup and stylesheets, tallies every colour, size, radius, and shadow, and infers the component inventory from repeated structure.",
    icon: ScanEye,
  },
  {
    number: "03",
    title: "Take the spec with you",
    body: "A fourteen-section design.md lands in your workspace. Edit it inline, copy it, or download it straight into Cursor, Claude Code, or your repo.",
    icon: FileCode2,
  },
];

const FEATURES = [
  {
    icon: Braces,
    title: "Real tokens, not vibes",
    body: "Values are read from the actual stylesheet — hex codes, font stacks, radii, shadows, and the spacing base unit — then normalised into CSS custom properties.",
  },
  {
    icon: Type,
    title: "A type scale you can use",
    body: "Every observed font-size is ordered into a display → caption scale, with suggested line-heights and weights marked separately from measured values.",
  },
  {
    icon: Layers,
    title: "Component inventory",
    body: "Navigation, buttons, cards, forms, footers, and badges are detected from repeated markup and described with the tokens they consume.",
  },
  {
    icon: ShieldCheck,
    title: "Honest by default",
    body: "Anything the reference doesn't prove is labelled estimated or unknown. No invented hex codes, no imaginary font names, no fake breakpoints.",
  },
  {
    icon: Gauge,
    title: "No account, no setup",
    body: "Open the page, submit a reference, get a document. Analyses are held in memory for two hours and then discarded.",
  },
  {
    icon: Wand2,
    title: "Built for agents",
    body: "Sections are ordered for implementation: structure first, tokens next, components last. Paste the file into a prompt and the agent has a plan.",
  },
];

const FAQ = [
  {
    q: "Do I need an account?",
    a: "No. UIvanta has no signup, no login, and no paywall. Every analysis runs anonymously, and the resulting document lives at a private link for two hours before it is discarded.",
  },
  {
    q: "How accurate is the extraction?",
    a: "Colour values, font stacks, sizes, radii, and shadows are read literally from the stylesheet and marked observed. Role assignments — which colour is 'primary', which size is 'h2' — are inferred and marked estimated. Anything unavailable is marked unknown instead of being invented.",
  },
  {
    q: "Why can't it read some websites?",
    a: "Pages that require a login, block automated readers, or render entirely on the client may return nothing useful. UIvanta tells you exactly what failed and suggests uploading a screenshot instead.",
  },
  {
    q: "Does it copy the website?",
    a: "No. UIvanta documents layout, spacing, and token values. It does not download or redistribute images, fonts, logos, or brand assets, and the generated file tells you to replace protected artwork with your own.",
  },
  {
    q: "What happens to my screenshots?",
    a: "Screenshots are sampled for colour on your device. Only the resulting palette, image dimensions, and any notes you add are sent to the server — the image itself never leaves your browser.",
  },
  {
    q: "Which tools can use design.md?",
    a: "Any editor or agent that accepts Markdown: Cursor, Claude Code, Windsurf, Copilot Chat, or a plain README. The file is deliberately tool-agnostic and structured with headings an agent can follow.",
  },
];

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute -left-10 top-4 h-[26rem] w-[26rem] rounded-full"
      />
      <div
        aria-hidden="true"
        className="hero-river pointer-events-none absolute -left-[8%] top-[6.5rem] h-[16rem] w-[42rem] rounded-full sm:top-[7.5rem] lg:w-[50rem]"
      />
      <div aria-hidden="true" className="hero-streams pointer-events-none absolute inset-0">
        <div className="hero-stream" />
        <div className="hero-stream" />
        <div className="hero-stream" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid-lines opacity-[0.4] [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_72%)]"
      />

      <div className="container-x relative grid items-center gap-14 pb-16 pt-10 lg:grid-cols-[1.06fr_0.94fr] lg:gap-8 lg:pb-24 lg:pt-16">
        <div className="relative z-10">
          <span className="rise rise-1 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-[0.75rem] font-semibold text-ink-soft shadow-sm backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-deep opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint-deep" />
            </span>
            Website → design.md, in about a minute
          </span>

          <h1 className="rise rise-2 mt-5 font-display text-[2.6rem] font-extrabold leading-[0.98] tracking-[-0.045em] text-ink sm:text-[3.4rem] lg:text-[3.85rem]">
            Turn any website into a{" "}
            <span className="relative inline-block text-gradient">
              design.md
              <svg
                viewBox="0 0 220 14"
                className="absolute -bottom-1 left-0 w-full text-mint"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9c38-6 74-7 108-4 34 3 68 2 108-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            your agent can build.
          </h1>

          <p className="rise rise-3 mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-ink-soft">
            Paste a URL or drop a screenshot. UIvanta reads the markup and stylesheets behind the
            reference — colours, type scale, spacing, components — and writes a spec your coding
            agent can actually follow.
          </p>

          <div className="rise rise-4 mt-8">
            <AnalyzeForm />
          </div>

          <ul className="rise rise-5 mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-muted">
            {["No signup", "No credit card", "Runs in your browser"].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-mint-deep" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rise rise-3 relative mx-auto w-full max-w-[34rem] lg:max-w-none">
          <HeroShapes className="w-full" />

          <div className="absolute left-0 top-6 w-[13.5rem] animate-float-slow rounded-2xl border border-line bg-white/92 p-3 shadow-lift backdrop-blur-sm sm:left-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                <FileCode2 className="h-3 w-3" aria-hidden="true" />
                design.md
              </span>
              <span className="rounded-full bg-mint-soft px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide text-mint-deep">
                ready
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-4/5 rounded-full bg-ink/12" />
              <div className="h-1.5 w-3/5 rounded-full bg-ink/8" />
              <div className="h-1.5 w-full rounded-full bg-blue/20" />
              <div className="h-1.5 w-2/3 rounded-full bg-ink/8" />
            </div>
          </div>

          <div className="absolute bottom-8 right-0 w-[12.5rem] animate-float-mid rounded-2xl border border-line bg-white/92 p-3 shadow-lift backdrop-blur-sm">
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-muted">
              palette
            </p>
            <div className="mt-2 flex gap-1">
              {["#4F46E5", "#7C6BFF", "#9FB0FF", "#D9D2FF", "#14161F"].map((hex) => (
                <span
                  key={hex}
                  className="h-6 w-6 rounded-md ring-1 ring-ink/10"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[0.625rem] text-ink-soft">
              <span>34 tokens</span>
              <span className="text-mint-deep">12 sections</span>
            </div>
          </div>

          <div className="absolute right-6 top-2 animate-drift rounded-full border border-line bg-white/90 px-2.5 py-1 font-mono text-[0.625rem] text-ink-soft shadow-soft backdrop-blur-sm">
            --radius-card: 24px
          </div>
        </div>
      </div>

      <TokenMarquee />
    </section>
  );
}

function TokenMarquee() {
  const items = [...TOKEN_STRIP, ...TOKEN_STRIP];
  return (
    <div className="relative border-y border-line/70 bg-white/50 py-3">
      <div
        className="flex w-max animate-marquee gap-2 px-4 hover:[animation-play-state:paused]"
        aria-hidden="true"
      >
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="whitespace-nowrap rounded-full border border-line bg-white px-3 py-1 font-mono text-[0.6875rem] text-muted"
          >
            {item}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-paper to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-paper to-transparent" />
      <span className="sr-only">
        Examples of extracted design tokens: colours, radii, type sizes, spacing, fonts and shadows.
      </span>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="relative py-20 lg:py-28">
      <div className="container-x">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow">
              <CircleDashed className="h-3 w-3" aria-hidden="true" />
              How it works
            </p>
            <h2 className="mt-3 text-[2rem] font-extrabold leading-[1.05] text-ink sm:text-[2.6rem]">
              Three steps from inspiration to implementation.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            No browser extension, no CLI, no account. The whole pipeline is a URL and a document.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.number}
                className="group relative overflow-hidden rounded-[26px] border border-line bg-white p-6 shadow-soft transition-shadow hover:shadow-lift"
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[0.6875rem] tracking-[0.18em] text-muted-2">
                    {step.number}
                  </span>
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      index === 1
                        ? "bg-mint-soft text-mint-deep"
                        : index === 2
                          ? "bg-[#FCE9EC] text-pink-deep"
                          : "bg-blue-soft text-blue-deep"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-6 text-[1.1875rem] font-bold tracking-[-0.02em] text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{step.body}</p>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-paper-2/70 transition-transform duration-500 group-hover:scale-110"
                />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function SampleOutput() {
  return (
    <section id="sample" className="relative overflow-hidden py-8 lg:py-14">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[32px] border border-line bg-ink px-5 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.55),transparent_65%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/4 h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(79,222,192,0.28),transparent_65%)]"
          />

          <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="eyebrow text-white/50">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Sample output
              </p>
              <h2 className="mt-3 text-[2rem] font-extrabold leading-[1.05] sm:text-[2.5rem]">
                One file. Fourteen sections. Zero guesswork.
              </h2>
              <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-white/70">
                Every document follows the same structure, so your agent always knows where to
                look. Values that came from the reference are separated from values that were
                inferred.
              </p>

              <dl className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { value: "14", label: "sections" },
                  { value: "34", label: "tokens" },
                  { value: "6", label: "components" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="font-display text-[1.75rem] font-extrabold text-white">
                      {stat.value}
                    </dt>
                    <dd className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white/50">
                      {stat.label}
                    </dd>
                  </div>
                ))}
              </dl>

              <Link
                href="/analyze"
                className="btn mt-8 bg-white text-ink hover:bg-white/90"
              >
                Generate yours
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#1B1726] shadow-2xl">
                <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FFD166]/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4FDEC0]/80" />
                  <span className="ml-2 font-mono text-[0.6875rem] text-white/45">design.md</span>
                  <span className="ml-auto rounded-full bg-white/8 px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wide text-white/60">
                    8.4 kb
                  </span>
                </div>
                <div className="max-h-[26rem] overflow-hidden p-5 font-mono text-[0.75rem] leading-[1.85]">
                  <p className="text-[#8F86FF]"># Design System — Acme Cloud</p>
                  <p className="mt-3 text-white/35">## 4. Color Palette</p>
                  <p className="text-white/70">
                    <span className="text-white/35">| </span>Role
                    <span className="text-white/35"> | </span>Token
                    <span className="text-white/35"> | </span>Value
                    <span className="text-white/35"> | </span>Confidence
                    <span className="text-white/35"> |</span>
                  </p>
                  <p className="text-white/70">
                    <span className="text-white/35">| </span>Primary
                    <span className="text-white/35"> | </span>
                    <span className="text-[#4FDEC0]">--color-primary</span>
                    <span className="text-white/35"> | </span>
                    <span className="text-[#F2BFC8]">#3A2FE8</span>
                    <span className="text-white/35"> | </span>
                    <span className="text-[#4FDEC0]">observed</span>
                    <span className="text-white/35"> |</span>
                  </p>
                  <p className="text-white/70">
                    <span className="text-white/35">| </span>Canvas
                    <span className="text-white/35"> | </span>
                    <span className="text-[#4FDEC0]">--color-background</span>
                    <span className="text-white/35"> | </span>
                    <span className="text-[#F2BFC8]">#FBF4F1</span>
                    <span className="text-white/35"> | </span>
                    <span className="text-[#4FDEC0]">observed</span>
                    <span className="text-white/35"> |</span>
                  </p>
                  <p className="text-white/70">
                    <span className="text-white/35">| </span>Border
                    <span className="text-white/35"> | </span>
                    <span className="text-[#4FDEC0]">--color-border</span>
                    <span className="text-white/35"> | </span>
                    <span className="text-[#F2BFC8]">#EADFDB</span>
                    <span className="text-white/35"> | </span>
                    <span className="text-[#FFD166]">estimated</span>
                    <span className="text-white/35"> |</span>
                  </p>
                  <p className="mt-4 text-white/35">## 5. Typography</p>
                  <p className="text-white/70">
                    <span className="text-white/35">- </span>Display:{" "}
                    <span className="text-[#F2BFC8]">56px</span> / 1.05 /{" "}
                    <span className="text-[#F2BFC8]">800</span>
                  </p>
                  <p className="text-white/70">
                    <span className="text-white/35">- </span>Body:{" "}
                    <span className="text-[#F2BFC8]">16px</span> / 1.6 /{" "}
                    <span className="text-[#F2BFC8]">400</span>
                  </p>
                  <p className="mt-4 text-white/35">## 8. Component Specifications</p>
                  <p className="text-white/70">
                    <span className="text-white/35">### </span>Buttons{" "}
                    <span className="text-white/35">— 12 instances</span>
                  </p>
                  <p className="text-white/55">
                    Fill <span className="text-[#F2BFC8]">#3A2FE8</span>, radius{" "}
                    <span className="text-[#F2BFC8]">999px</span>, 44px min target.
                  </p>
                  <p className="mt-4 text-white/35">## 14. Constraints</p>
                  <p className="text-white/55">
                    Unknown: hover visuals, motion timing, authenticated states.
                  </p>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-4 hidden w-[11rem] rounded-xl border border-white/12 bg-[#221D2E]/95 p-3 shadow-xl backdrop-blur sm:block">
                <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-white/40">
                  tokens.css
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["#3A2FE8", "#7C5CFF", "#4FDEC0", "#F2BFC8", "#FBF4F1", "#14111F"].map((hex) => (
                    <span
                      key={hex}
                      className="h-5 w-5 rounded ring-1 ring-white/15"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="relative py-20 lg:py-28">
      <div className="container-x">
        <div className="max-w-2xl">
          <p className="eyebrow">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            What's inside
          </p>
          <h2 className="mt-3 text-[2rem] font-extrabold leading-[1.05] text-ink sm:text-[2.6rem]">
            A design document your codebase can trust.
          </h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
            Not a screenshot summary. A structured specification built from the reference's own
            stylesheets, normalised into tokens you can drop into any stack.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            const accent =
              index % 3 === 0
                ? "bg-blue-soft text-blue-deep"
                : index % 3 === 1
                  ? "bg-mint-soft text-mint-deep"
                  : "bg-[#FCE9EC] text-pink-deep";
            return (
              <article
                key={feature.title}
                className="group relative flex flex-col rounded-[24px] border border-line bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Confidence() {
  return (
    <section id="confidence" className="relative overflow-hidden py-8 lg:py-16">
      <div className="container-x">
        <div className="grid items-center gap-10 rounded-[32px] border border-line bg-gradient-to-br from-white via-white to-paper-2/70 p-6 sm:p-10 lg:grid-cols-[1fr_0.95fr] lg:p-14">
          <div>
            <p className="eyebrow">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              The confidence model
            </p>
            <h2 className="mt-3 text-[1.9rem] font-extrabold leading-[1.08] text-ink sm:text-[2.35rem]">
              Every value is labelled. Including the ones we don't know.
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
              Most design-extraction tools hallucinate a font name and move on. UIvanta splits every
              token into three states, so you know what to trust and what to verify in the browser.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                {
                  label: "Observed",
                  tone: "bg-mint-soft text-mint-deep",
                  body: "Read literally from the stylesheet or pixel data.",
                },
                {
                  label: "Estimated",
                  tone: "bg-[#FFF4D6] text-[#9A6B00]",
                  body: "Inferred role or conventional default — verify visually.",
                },
                {
                  label: "Unknown",
                  tone: "bg-paper-2 text-muted",
                  body: "No evidence. The document says so instead of inventing a value.",
                },
              ].map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex shrink-0 rounded-full px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wide ${item.tone}`}
                  >
                    {item.label}
                  </span>
                  <span className="text-sm leading-relaxed text-ink-soft">{item.body}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                  tokens · 34
                </span>
                <span className="font-mono text-[0.625rem] text-muted-2">acme-cloud</span>
              </div>
              <ul className="divide-y divide-line/70">
                {[
                  { name: "--color-primary", value: "#3A2FE8", state: "observed", tone: "text-mint-deep bg-mint-soft" },
                  { name: "--font-sans", value: "Gilroy", state: "observed", tone: "text-mint-deep bg-mint-soft" },
                  { name: "--text-h2", value: "40px", state: "observed", tone: "text-mint-deep bg-mint-soft" },
                  { name: "--space-section", value: "96px", state: "observed", tone: "text-mint-deep bg-mint-soft" },
                  { name: "--radius-card", value: "24px", state: "estimated", tone: "text-[#9A6B00] bg-[#FFF4D6]" },
                  { name: "--shadow-lg", value: "0 24px 60px", state: "estimated", tone: "text-[#9A6B00] bg-[#FFF4D6]" },
                  { name: "--motion-ease", value: "not available", state: "unknown", tone: "text-muted bg-paper-2" },
                ].map((row) => (
                  <li key={row.name} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="font-mono text-[0.75rem] text-ink-soft">{row.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[0.75rem] font-medium text-ink">{row.value}</span>
                      <span className={`rounded-full px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase ${row.tone}`}>
                        {row.state}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <ShapeCluster className="pointer-events-none absolute -bottom-10 -right-6 hidden w-40 sm:block" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="relative py-20 lg:py-24">
      <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">
            <CircleDashed className="h-3 w-3" aria-hidden="true" />
            Questions
          </p>
          <h2 className="mt-3 text-[2rem] font-extrabold leading-[1.05] text-ink sm:text-[2.4rem]">
            Things people ask before their first run.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Still curious? Generate a document — it takes about a minute and needs nothing from you.
          </p>
          <Link href="/analyze" className="btn btn-outline mt-6 h-11 px-5 text-sm">
            Try it now
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.9375rem] font-semibold text-ink">
                {item.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-transform duration-200 group-open:rotate-45">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="relative pb-20 lg:pb-24">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[32px] bg-blue px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -right-10 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(79,222,192,0.5),transparent_65%)]"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-[2rem] font-extrabold leading-[1.05] text-white sm:text-[2.75rem]">
              Stop describing references in chat.
            </h2>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-white/80">
              Give your agent a document instead. One URL, one minute, one design.md.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/analyze" className="btn bg-white text-ink hover:bg-white/90">
                Analyze a website
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/#sample"
                className="btn border border-white/25 text-white hover:bg-white/10"
              >
                See a sample
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <HowItWorks />
        <SampleOutput />
        <Features />
        <Confidence />
        <Faq />
        <DeveloperSection />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
