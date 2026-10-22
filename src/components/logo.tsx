import Link from "next/link";

/**
 * The UIvanta mark — two gradient lobes forming a soft "U".
 * The mark floats (see `.logo-mark`); the wordmark beside it never moves.
 */
export function LogoMark({
  size = 30,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={`logo-mark shrink-0 ${className}`}
    >
      <defs>
        <linearGradient
          id="uiv-lobe-left"
          x1="5"
          y1="4"
          x2="25"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8B7CFF" />
          <stop offset="0.55" stopColor="#5B53F0" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient
          id="uiv-lobe-right"
          x1="23"
          y1="4"
          x2="43"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4F8DF7" />
          <stop offset="1" stopColor="#A5B4FC" />
        </linearGradient>
      </defs>

      {/* left lobe */}
      <path
        d="M15 4C8 4 5 10 5 17V30C5 38 11 44 19 44C22 44 25 42 25 39V18C25 10 21 4 15 4Z"
        fill="url(#uiv-lobe-left)"
      />
      {/* right lobe (slightly overlapping for a layered seam) */}
      <path
        d="M33 4C40 4 43 10 43 17V30C43 38 37 44 29 44C26 44 23 42 23 39V18C23 10 27 4 33 4Z"
        fill="url(#uiv-lobe-right)"
      />
      {/* soft specular highlights */}
      <path
        d="M12 13C10.4 14.6 9.5 16.8 9.5 19.4"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 13C28.6 14.4 27.8 16.2 27.6 18.4"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
      aria-label="UIvanta home"
    >
      <LogoMark size={compact ? 26 : 30} />
      <span
        className={`logo-wordmark font-display font-extrabold tracking-[-0.05em] text-ink ${
          compact ? "text-lg" : "text-[1.35rem]"
        }`}
      >
        UIvanta
        <span className="text-blue">.</span>
      </span>
    </Link>
  );
}
