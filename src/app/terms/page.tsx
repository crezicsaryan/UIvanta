import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Terms",
  description: "The terms that apply when you use UIvanta.",
};

const SECTIONS = [
  {
    title: "What UIvanta does",
    body: "UIvanta analyses a public web page or a screenshot and generates a Markdown design specification. It is a documentation tool, not a website cloner: it does not download, reproduce, or redistribute source code, fonts, images, or brand assets.",
  },
  {
    title: "Acceptable use",
    body: "Submit only pages you are permitted to view and reference. Do not use UIvanta to probe private networks, bypass authentication or paywalls, scrape at scale, or reproduce protected branding without authorisation.",
  },
  {
    title: "Accuracy",
    body: "Extracted values are labelled observed, estimated, or unknown. Estimated and unknown values are not guarantees. You are responsible for verifying a design specification before shipping it.",
  },
  {
    title: "Availability",
    body: "Analyses are stored in memory for two hours and may be lost if the service restarts. There is no backup and no account recovery.",
  },
  {
    title: "Liability",
    body: "UIvanta is provided as-is, without warranty. We are not liable for design, legal, or business decisions made from a generated document.",
  },
];

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container-x py-14 lg:py-20">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 max-w-2xl text-[2.2rem] font-extrabold leading-[1.05] text-ink sm:text-[2.8rem]">
          Terms of use.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Short version: use it on pages you're allowed to look at, verify what it tells you, and
          don't treat it as a way to copy someone else's brand.
        </p>

        <div className="mt-10 max-w-3xl divide-y divide-line rounded-2xl border border-line bg-white">
          {SECTIONS.map((section) => (
            <section key={section.title} className="p-6">
              <h2 className="text-base font-bold text-ink">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{section.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-2">
          Last updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}.{" "}
          <Link href="/privacy" className="text-blue hover:underline">
            Privacy policy
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
