"use client";

import { useEffect, useRef } from "react";

/**
 * Premium ambient background — large, softly-lit indigo / blue / lavender
 * gradient orbs drifting behind the content. Purely decorative:
 * fixed, non-interactive, and it keeps a gentle drift even under reduced
 * motion (only the pointer parallax is disabled there).
 */
export function AmbientBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    const onMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="ambient-root">
      <div className="ambient-base" />

      {/* Indigo orb — top left */}
      <div
        className="orb-wrap"
        style={{ top: "-18%", left: "-12%", ["--depth" as string]: "30px" }}
      >
        <div
          className="orb orb-a"
          style={{
            width: "52rem",
            height: "52rem",
            background:
              "radial-gradient(circle at 32% 30%, rgba(99,102,241,0.7), rgba(99,102,241,0) 64%)",
          }}
        />
      </div>

      {/* Electric-blue orb — top right */}
      <div
        className="orb-wrap"
        style={{ top: "-2%", right: "-14%", ["--depth" as string]: "44px" }}
      >
        <div
          className="orb orb-b"
          style={{
            width: "46rem",
            height: "46rem",
            background:
              "radial-gradient(circle at 62% 42%, rgba(59,130,246,0.6), rgba(59,130,246,0) 64%)",
          }}
        />
      </div>

      {/* Lavender orb — lower centre */}
      <div
        className="orb-wrap"
        style={{ bottom: "-20%", left: "18%", ["--depth" as string]: "34px" }}
      >
        <div
          className="orb orb-c"
          style={{
            width: "50rem",
            height: "50rem",
            background:
              "radial-gradient(circle at 50% 50%, rgba(167,139,250,0.62), rgba(167,139,250,0) 66%)",
          }}
        />
      </div>

      {/* Soft periwinkle accent — mid right */}
      <div
        className="orb-wrap"
        style={{ top: "44%", right: "6%", ["--depth" as string]: "22px" }}
      >
        <div
          className="orb orb-a"
          style={{
            width: "32rem",
            height: "32rem",
            background:
              "radial-gradient(circle at 50% 50%, rgba(129,140,248,0.45), rgba(129,140,248,0) 68%)",
            animationDelay: "-6s",
          }}
        />
      </div>

      {/* Pale violet — lower left */}
      <div
        className="orb-wrap"
        style={{ bottom: "6%", left: "-8%", ["--depth" as string]: "26px" }}
      >
        <div
          className="orb orb-b"
          style={{
            width: "30rem",
            height: "30rem",
            background:
              "radial-gradient(circle at 50% 50%, rgba(196,181,253,0.5), rgba(196,181,253,0) 70%)",
            animationDelay: "-9s",
          }}
        />
      </div>

      <div className="ambient-grid" />
      <div className="ambient-noise" />
    </div>
  );
}
