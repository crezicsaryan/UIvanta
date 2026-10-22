import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Privacy",
  description: "How UIvanta handles the URLs, screenshots, and documents you submit.",
};

const SECTIONS = [
  {
    title: "What we collect",
    body: "A submitted URL, the viewport you selected, optional notes, and the public HTML and stylesheets of the page you asked us to read. For screenshot analyses we receive only a colour palette, image dimensions, and your optional notes — the image itself is sampled in your browser and never uploaded.",
  },
  {
    title: "Why we collect it",
    body: "Solely to produce the design.md document you requested. Nothing is used to train models, build profiles, or advertise.",
  },
  {
    title: "How long we keep it",
    body: "Analyses live in process memory for two hours, then are discarded. There is no account, so there is no long-term archive to delete.",
  },
  {
    title: "What we never store",
    body: "Full screenshots, authenticated page content, private network addresses, and any credentials. URLs pointing at private or reserved networks are blocked before any request is made.",
  },
  {
    title: "Third parties",
    body: "Fetched pages are requested directly from the origin server with an identifying user agent. No analytics vendor or advertising network receives your submissions.",
  },
  {
    title: "Your control",
    body: "You can abandon an analysis at any time; it expires on its own. Because nothing is tied to an identity, we cannot retrieve or export a document on your behalf after it expires.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container-x py-14 lg:py-20">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 max-w-2xl text-[2.2rem] font-extrabold leading-[1.05] text-ink sm:text-[2.8rem]">
          Privacy, in plain language.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          UIvanta is a single-purpose tool. It reads a public page and writes a document. This page
          explains exactly what that involves.
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
          Last updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}.
          Questions? <Link href="/#faq" className="text-blue hover:underline">Read the FAQ</Link>.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
