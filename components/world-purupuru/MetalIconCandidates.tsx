// Metal-icon candidates — the world-purupuru bucket only ships
// `jani-metal-element-face` for the metal slot; this file authors
// alternates that match the symbolic register of sprout/flame/sun/drop.

interface CandidateProps {
  className?: string;
}

const STROKE = "var(--puru-metal-vivid)";
const TINT = "color-mix(in oklch, var(--puru-metal-vivid) 22%, transparent)";

// Common viewBox + stroke styling for a watercolor-pastel feel.
const baseSvgProps = {
  viewBox: "0 0 100 100",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  preserveAspectRatio: "xMidYMid meet" as const,
};

export function MetalBell({ className }: CandidateProps) {
  return (
    <svg {...baseSvgProps} className={className} aria-label="metal · bell">
      <path
        d="M50 18 C 36 18, 28 32, 28 52 C 28 60, 24 68, 22 72 L 78 72 C 76 68, 72 60, 72 52 C 72 32, 64 18, 50 18 Z"
        fill={TINT}
        stroke={STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M50 12 L 50 18" stroke={STROKE} strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="80" r="5" fill={STROKE} opacity="0.85" />
    </svg>
  );
}

export function MetalCoin({ className }: CandidateProps) {
  return (
    <svg {...baseSvgProps} className={className} aria-label="metal · coin">
      <circle cx="50" cy="50" r="32" fill={TINT} stroke={STROKE} strokeWidth="3" />
      <rect
        x="42"
        y="38"
        width="16"
        height="24"
        fill="none"
        stroke={STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <line x1="32" y1="50" x2="42" y2="50" stroke={STROKE} strokeWidth="3" strokeLinecap="round" />
      <line x1="58" y1="50" x2="68" y2="50" stroke={STROKE} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MetalGem({ className }: CandidateProps) {
  return (
    <svg {...baseSvgProps} className={className} aria-label="metal · gem">
      <path
        d="M50 18 L 78 42 L 50 84 L 22 42 Z"
        fill={TINT}
        stroke={STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M22 42 L 50 50 L 78 42"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M50 50 L 50 84" stroke={STROKE} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function MetalIngot({ className }: CandidateProps) {
  return (
    <svg {...baseSvgProps} className={className} aria-label="metal · ingot">
      <path
        d="M22 38 L 30 28 L 70 28 L 78 38 L 78 64 L 70 74 L 30 74 L 22 64 Z"
        fill={TINT}
        stroke={STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M30 28 L 30 74 M70 28 L 70 74"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeOpacity="0.5"
      />
    </svg>
  );
}

export function MetalMirror({ className }: CandidateProps) {
  return (
    <svg {...baseSvgProps} className={className} aria-label="metal · mirror">
      <ellipse cx="50" cy="42" rx="24" ry="28" fill={TINT} stroke={STROKE} strokeWidth="3" />
      <path d="M40 76 L 50 70 L 60 76 L 50 88 Z" fill={STROKE} opacity="0.9" />
      <path
        d="M44 32 C 42 38, 42 44, 46 50"
        stroke="oklch(1 0 0 / 0.5)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function MetalKey({ className }: CandidateProps) {
  return (
    <svg {...baseSvgProps} className={className} aria-label="metal · key">
      <circle cx="34" cy="50" r="14" fill={TINT} stroke={STROKE} strokeWidth="3" />
      <circle cx="34" cy="50" r="4" fill={STROKE} />
      <path
        d="M48 50 L 82 50 L 82 60 M70 50 L 70 60"
        stroke={STROKE}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export const METAL_CANDIDATES: Array<{
  id: string;
  label: string;
  Component: (p: CandidateProps) => React.ReactElement;
}> = [
  { id: "bell", label: "bell · 鈴", Component: MetalBell },
  { id: "coin", label: "coin · 銭", Component: MetalCoin },
  { id: "gem", label: "gem · 玉", Component: MetalGem },
  { id: "ingot", label: "ingot · 鋳", Component: MetalIngot },
  { id: "mirror", label: "mirror · 鏡", Component: MetalMirror },
  { id: "key", label: "key · 鍵", Component: MetalKey },
];
