import Link from "next/link";
import { ArrowLeft, Check, FileCode2, Info, ScanEye, ShieldCheck } from "lucide-react";
import { AnalyzeForm } from "@/components/analyze-form";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "New analysis",
  description: "Submit a public URL or a screenshot and generate an implementation-ready design.md.",
};

const DELIVERABLES = [
  "Colour palette with hex values and contrast ratios",
  "Type scale from display through caption",
  "Spacing base unit and section rhythm",
  "Radii, shadows, and container width",
  "Component inventory: nav, buttons, cards, forms, footer",
  "Page structure in reading order",
  "Accessibility and responsive guidance",
  "A 14-section Markdown document you can edit",
];

export default function AnalyzePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="hero-glow pointer-events-none absolute -right-16 -top-10 h-[24rem] w-[24rem] rounded-full"
        />
        <div className="container-x relative py-10 lg:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <div>
              <p className="eyebrow">
                <ScanEye className="h-3 w-3" aria-hidden="true" />
                New analysis
              </p>
              <h1 className="mt-3 text-[2.2rem] font-extrabold leading-[1.02] tracking-[-0.04em] text-ink sm:text-[2.9rem]">
                What are we documenting?
              </h1>
              <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-muted">
                Submit a public page or a screenshot. You'll get a progress view first, then a
                workspace where you can read, edit, copy, and download the generated{" "}
                <code className="font-mono text-[0.8125rem] text-ink-soft">design.md</code>.
              </p>

              <div className="mt-8">
                <AnalyzeForm variant="page" />
              </div>

              <div className="mt-8 flex items-start gap-2.5 rounded-2xl border border-line bg-white/70 p-4 text-[0.8125rem] leading-relaxed text-muted">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue" aria-hidden="true" />
                <p>
                  <span className="font-semibold text-ink">A note on accuracy.</span> UIvanta reads
                  static HTML and CSS. Values produced by JavaScript after load, authenticated
                  states, and animation timing will be labelled <em>unknown</em> rather than
                  guessed. If a site blocks automated readers, upload a screenshot instead.
                </p>
              </div>
            </div>

            <aside className="lg:pt-14">
              <div className="rounded-[26px] border border-line bg-white p-6 shadow-soft">
                <h2 className="flex items-center gap-2 text-[1.0625rem] font-bold text-ink">
                  <FileCode2 className="h-4 w-4 text-blue" aria-hidden="true" />
                  What you'll get
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {DELIVERABLES.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-ink-soft">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-deep" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-xl bg-paper-2/70 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <ShieldCheck className="h-3.5 w-3.5 text-mint-deep" aria-hidden="true" />
                    Private by default
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">
                    No account is created. Analyses live in memory for two hours. Screenshots are
                    colour-sampled on your device and never uploaded.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[26px] border border-line bg-white/60 p-6">
                <h2 className="text-sm font-bold text-ink">Good references to start with</h2>
                <ul className="mt-2 space-y-1.5 text-[0.8125rem] text-muted">
                  <li>· Marketing landing pages with a clear hero</li>
                  <li>· Dashboard shells with cards and tables</li>
                  <li>· Documentation layouts with sidebar navigation</li>
                  <li>· Pricing pages with repeated card components</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
