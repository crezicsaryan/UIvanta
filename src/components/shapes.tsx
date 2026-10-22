/* Illustrated 3D geometry — the visual signature of the UIvanta template. */

type CubePalette = { top: string; left: string; right: string };

const BLUE: CubePalette = { top: "#6366F1", left: "#4338CA", right: "#4F46E5" };
const MINT: CubePalette = { top: "#C7D2FE", left: "#4338CA", right: "#7C6BFF" };
const PINK: CubePalette = { top: "#EDE9FE", left: "#A78BFA", right: "#C4B5FD" };

function Cube({
  x,
  y,
  s = 60,
  palette = BLUE,
  rotate = 0,
  opacity = 1,
}: {
  x: number;
  y: number;
  s?: number;
  palette?: CubePalette;
  rotate?: number;
  opacity?: number;
}) {
  const w = s * 0.56;
  const h = s * 0.3;
  const d = s * 0.58;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity}>
      <path
        d={`M0 ${-h} L${w} 0 L0 ${h} L${-w} 0 Z`}
        fill={palette.top}
        stroke="rgba(20,17,31,0.06)"
        strokeWidth="0.75"
      />
      <path
        d={`M${-w} 0 L0 ${h} L0 ${h + d} L${-w} ${d} Z`}
        fill={palette.left}
        stroke="rgba(20,17,31,0.05)"
        strokeWidth="0.75"
      />
      <path
        d={`M${w} 0 L0 ${h} L0 ${h + d} L${w} ${d} Z`}
        fill={palette.right}
        stroke="rgba(20,17,31,0.05)"
        strokeWidth="0.75"
      />
      <path
        d={`M${-w * 0.55} ${-h * 0.28} L${-w * 0.1} ${-h * 0.05}`}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth={Math.max(2, s * 0.035)}
        strokeLinecap="round"
      />
    </g>
  );
}

function Sphere({
  x,
  y,
  r,
  from = "#A5B4FC",
  to = "#4338CA",
  id,
}: {
  x: number;
  y: number;
  r: number;
  from?: string;
  to?: string;
  id: string;
}) {
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="26%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
      <ellipse
        cx={x - r * 0.3}
        cy={y - r * 0.42}
        rx={r * 0.34}
        ry={r * 0.2}
        fill="#fff"
        opacity="0.55"
        transform={`rotate(-28 ${x - r * 0.3} ${y - r * 0.42})`}
      />
    </g>
  );
}

function HalfDisc({
  x,
  y,
  r,
  rotate = 0,
  from,
  to,
  id,
  opacity = 1,
}: {
  x: number;
  y: number;
  r: number;
  rotate?: number;
  from: string;
  to: string;
  id: string;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity}>
      <defs>
        <linearGradient id={id} x1={-r} y1={-r} x2={r} y2={r} gradientUnits="userSpaceOnUse">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <path d={`M${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 Z`} fill={`url(#${id})`} />
      <path
        d={`M${-r * 0.82} ${-r * 0.16} A ${r * 0.82} ${r * 0.82} 0 0 1 ${-r * 0.2} ${-r * 0.78}`}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={r * 0.06}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

function Squiggle({
  d,
  color = "#818CF8",
  width = 9,
  opacity = 1,
}: {
  d: string;
  color?: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <path
      d={d}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      fill="none"
      opacity={opacity}
    />
  );
}

function Arc({
  d,
  color = "#818CF8",
  width = 10,
  opacity = 1,
}: {
  d: string;
  color?: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" fill="none" opacity={opacity} />
  );
}

/** Large hero composition — floats over the blush surface. */
export function HeroShapes({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 600"
      className={className}
      role="img"
      aria-label="Illustration of floating three-dimensional geometric shapes in indigo, blue and lavender"
    >
      {/* soft ambience */}
      <defs>
        <radialGradient id="amb1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7C6BFF" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#7C6BFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="amb2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="300" cy="240" r="250" fill="url(#amb1)" />
      <circle cx="420" cy="430" r="200" fill="url(#amb2)" />

      {/* connectors */}
      <path
        d="M120 470 C 190 430, 210 360, 292 330 S 420 300, 470 200"
        stroke="#C4B5FD"
        strokeWidth="3.5"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M470 200 C 500 150, 470 110, 430 92"
        stroke="#C4B5FD"
        strokeWidth="3.5"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M292 330 C 350 400, 420 430, 500 470"
        stroke="#C4B5FD"
        strokeWidth="3"
        fill="none"
        opacity="0.6"
      />

      {/* large discs */}
      <HalfDisc id="d1" x={470} y={150} r={120} rotate={-28} from="#A5B4FC" to="#4F46E5" opacity={0.95} />
      <HalfDisc id="d2" x={395} y={505} r={104} rotate={188} from="#EDE9FE" to="#A78BFA" />
      <HalfDisc id="d3" x={318} y={330} r={86} rotate={-12} from="#C7D2FE" to="#4338CA" />

      {/* arcs */}
      <Arc d="M232 300 A 26 26 0 1 0 236 350" color="#6366F1" width={10} />
      <Arc d="M452 470 A 22 22 0 1 1 470 512" color="#7C6BFF" width={9} />
      <Arc d="M180 148 A 18 18 0 1 0 196 182" color="#818CF8" width={8} opacity={0.9} />

      {/* squiggles */}
      <Squiggle d="M318 470 q 22 -30 44 0 t 44 0" color="#7C6BFF" width={9} />

      {/* cubes */}
      <Cube x={168} y={378} s={86} palette={PINK} rotate={-6} />
      <Cube x={390} y={112} s={78} palette={BLUE} rotate={4} />
      <Cube x={360} y={372} s={54} palette={MINT} rotate={-10} />
      <Cube x={432} y={318} s={66} palette={BLUE} rotate={8} />
      <Cube x={470} y={520} s={62} palette={BLUE} rotate={-4} />

      {/* spheres */}
      <Sphere id="s1" x={318} y={252} r={44} from="#C7D2FE" to="#4F46E5" />
      <Sphere id="s2" x={196} y={330} r={22} from="#A5B4FC" to="#4F46E5" />
      <Sphere id="s3" x={430} y={228} r={16} from="#EDE9FE" to="#8B5CF6" />
      <Sphere id="s4" x={300} y={486} r={40} from="#C7D2FE" to="#6366F1" />
      <Sphere id="s5" x={468} y={430} r={13} from="#A5B4FC" to="#4338CA" />
      <Sphere id="s6" x={168} y={300} r={10} from="#A5B4FC" to="#4338CA" />
    </svg>
  );
}

/** Smaller decorative cluster used between sections. */
export function ShapeCluster({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <HalfDisc id="sc-d" x={120} y={110} r={62} rotate={-18} from="#C7D2FE" to="#4F46E5" opacity={0.9} />
      <path
        d="M30 170 C 70 150, 80 120, 120 108 S 190 84, 212 46"
        stroke="#C4B5FD"
        strokeWidth="2.5"
        fill="none"
      />
      <Cube x={78} y={126} s={54} palette={PINK} rotate={-8} />
      <Cube x={176} y={92} s={46} palette={BLUE} rotate={10} />
      <Sphere id="sc-s1" x={140} y={78} r={20} from="#C7D2FE" to="#4F46E5" />
      <Sphere id="sc-s2" x={58} y={100} r={10} from="#A5B4FC" to="#4338CA" />
      <Squiggle d="M186 148 q 14 -18 28 0 t 28 0" color="#7C6BFF" width={7} />
    </svg>
  );
}

/** Ambient gradient blobs for page backgrounds. */
export function AmbientBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.22),transparent_65%)] blur-[2px]" />
      <div className="absolute -right-24 top-24 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(79,222,192,0.24),transparent_65%)]" />
      <div className="absolute bottom-0 left-1/3 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(242,191,200,0.35),transparent_65%)]" />
    </div>
  );
}
