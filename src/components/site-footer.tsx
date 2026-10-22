import Link from "next/link";
import { LogoMark } from "./logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Analyze a site", href: "/analyze" },
      { label: "How it works", href: "/#how" },
      { label: "Sample output", href: "/#sample" },
      { label: "Features", href: "/#features" },
      { label: "Developer", href: "/#developer" },
    ],
  },
  {
    title: "Reference",
    links: [
      { label: "Confidence model", href: "/#confidence" },
      { label: "FAQ", href: "/#faq" },
      { label: "Design token spec", href: "/#sample" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-paper-2/50">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <LogoMark size={26} />
            <span className="font-display text-lg font-extrabold tracking-[-0.05em] text-ink">
              UIvanta<span className="text-blue">.</span>
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Turn any website into an implementation-ready <code className="font-mono text-[0.8125rem] text-ink-soft">design.md</code>.
            No account, no setup — just the design system, documented.
          </p>
          <p className="mt-4 text-xs text-muted-2">
            Analyses are held in memory for two hours, then discarded.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-2">
              {column.title}
            </h2>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-soft transition-colors hover:text-blue"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container-x flex flex-col gap-3 border-t border-line/70 py-6 text-xs text-muted-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} UIvanta. Built for people who ship interfaces.</p>
        <p>
          Values marked <span className="font-semibold text-ink-soft">estimated</span> are inferred — always verify before shipping.
        </p>
      </div>
    </footer>
  );
}
