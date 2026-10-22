import { Code2, Github, Linkedin } from "lucide-react";

const GITHUB_URL = "https://github.com/crezicsaryan";
const LINKEDIN_URL =
  "https://www.linkedin.com/in/aryan-singh-616791332?utm_source=share_via&utm_content=profile&utm_medium=member_android";

export function DeveloperSection() {
  return (
    <section id="developer" className="relative py-8 lg:py-14">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[32px] border border-line bg-white/80 p-6 shadow-soft backdrop-blur-xl sm:p-10 lg:p-12">
          {/* ambient light */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,107,255,0.35),transparent_65%)] blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-12 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.28),transparent_65%)] blur-2xl"
          />

          <div className="relative grid items-center gap-8 sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] lg:gap-12">
            {/* Photo */}
            <div className="relative mx-auto w-fit sm:mx-0">
              <div
                aria-hidden="true"
                className="absolute -inset-1.5 rounded-[30px] bg-gradient-to-br from-blue/50 via-violet/40 to-mint/50 blur-md"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/developer-aryan.jpg"
                alt="Aryan Singh, developer of UIvanta"
                width={176}
                height={176}
                loading="lazy"
                className="relative h-40 w-40 rounded-[26px] border border-white/70 object-cover shadow-lift sm:h-44 sm:w-44"
              />
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-white px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-soft shadow-soft">
                Design × Code
              </span>
            </div>

            {/* Bio */}
            <div className="text-center sm:text-left">
              <div className="flex justify-center sm:justify-start">
                <p className="eyebrow">
                  <Code2 className="h-3 w-3" aria-hidden="true" />
                  The developer
                </p>
              </div>
              <h2 className="mt-3 font-display text-[1.9rem] font-extrabold leading-tight tracking-[-0.04em] text-ink sm:text-[2.4rem]">
                Aryan Singh
              </h2>
              <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-ink-soft">
                Engineer in the making. Questioning the obvious. Building beyond the expected.
              </p>
              <p className="mt-3 text-sm text-muted">
                Built UIvanta end to end — the design system, the analysis engine, and the interface
                you&apos;re looking at.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:col-span-2 sm:justify-start lg:col-span-1 lg:flex-col lg:items-stretch">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-outline h-11 px-4 text-sm"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                GitHub
              </a>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-outline h-11 px-4 text-sm"
              >
                <Linkedin className="h-4 w-4" aria-hidden="true" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
