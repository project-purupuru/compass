// /api/og · placeholder OG image generator for Blink card icons
//
// Returns SVG with element-themed gradient + step/archetype text. Lightweight
// stand-in until operator's archetype + NFT art lands · then we swap to
// next/og ImageResponse to render the real images dynamically.
//
// Modes (mutually exclusive · query params):
//   ?step=N         · 1..8 · per-step icon (rotates element by step % 5)
//   ?archetype=X    · WOOD|FIRE|EARTH|METAL|WATER · archetype reveal icon

import { NextResponse } from "next/server";

type Element = "WOOD" | "FIRE" | "EARTH" | "METAL" | "WATER";

// Element palette · OKLCH from app/globals.css (sync if globals change).
// SVGs use fill values · OKLCH is well-supported in modern browsers + nextjs.
const ELEMENTS: Record<
  Element,
  { vivid: string; pastel: string; ink: string; symbol: string; ja: string }
> = {
  WOOD: {
    vivid: "oklch(0.81 0.144 112.7)",
    pastel: "oklch(0.82 0.080 145)",
    ink: "oklch(0.30 0.120 112.7)",
    symbol: "木",
    ja: "Wood",
  },
  FIRE: {
    vivid: "oklch(0.64 0.181 28.4)",
    pastel: "oklch(0.80 0.080 45)",
    ink: "oklch(0.30 0.150 28.4)",
    symbol: "火",
    ja: "Fire",
  },
  EARTH: {
    vivid: "oklch(0.85 0.153 83.8)",
    pastel: "oklch(0.88 0.120 85)",
    ink: "oklch(0.40 0.150 83.8)",
    symbol: "土",
    ja: "Earth",
  },
  METAL: {
    vivid: "oklch(0.52 0.126 309.7)",
    pastel: "oklch(0.82 0.060 310)",
    ink: "oklch(0.30 0.090 309.7)",
    symbol: "金",
    ja: "Metal",
  },
  WATER: {
    vivid: "oklch(0.53 0.180 266.2)",
    pastel: "oklch(0.88 0.060 230)",
    ink: "oklch(0.30 0.150 266.2)",
    symbol: "水",
    ja: "Water",
  },
};

const STEP_TO_ELEMENT: ReadonlyArray<Element> = [
  "WOOD", // step 1
  "FIRE", // step 2
  "WATER", // step 3
  "EARTH", // step 4
  "METAL", // step 5
  "WOOD", // step 6
  "FIRE", // step 7
  "WATER", // step 8 (final · cools to water before reveal)
];

function svg({
  element,
  primary,
  secondary,
}: {
  element: Element;
  primary: string;
  secondary: string;
}): string {
  const { vivid, pastel, ink, symbol, ja } = ELEMENTS[element];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="${pastel}" />
      <stop offset="100%" stop-color="${vivid}" />
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <circle cx="300" cy="280" r="180" fill="${pastel}" opacity="0.35" filter="url(#soft)"/>
  <text x="300" y="350"
        font-family="serif"
        font-size="280"
        font-weight="400"
        fill="${ink}"
        text-anchor="middle"
        opacity="0.92">${symbol}</text>
  <text x="300" y="510"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="36"
        font-weight="500"
        fill="${ink}"
        text-anchor="middle"
        letter-spacing="0.08em"
        opacity="0.75">${primary}</text>
  ${
    secondary
      ? `<text x="300" y="555"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="20"
        font-weight="400"
        fill="${ink}"
        text-anchor="middle"
        letter-spacing="0.06em"
        opacity="0.55">${secondary}</text>`
      : ""
  }
  <!-- corner element label · top-left -->
  <text x="40" y="60"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="22"
        font-weight="600"
        fill="${ink}"
        opacity="0.6"
        letter-spacing="0.15em">${ja.toUpperCase()}</text>
</svg>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const step = url.searchParams.get("step");
  const archetype = url.searchParams.get("archetype")?.toUpperCase();

  let body: string;

  if (archetype && (archetype as Element) in ELEMENTS) {
    // Archetype reveal icon · large element symbol + element name.
    // (Reveal cards now serve the actual stone PNG via quiz-renderer.ts ·
    // this route stays as a fallback for any direct /api/og?archetype=X hit.)
    body = svg({
      element: archetype as Element,
      primary: "Your Element",
      secondary: ELEMENTS[archetype as Element].ja,
    });
  } else if (step) {
    const n = Number.parseInt(step, 10);
    if (Number.isInteger(n) && n >= 1 && n <= 8) {
      const element = STEP_TO_ELEMENT[n - 1];
      body = svg({
        element,
        primary: `Question ${n}`,
        secondary: "of 8",
      });
    } else {
      // Unknown step · fall through to default
      body = svg({
        element: "WOOD",
        primary: "purupuru",
        secondary: "",
      });
    }
  } else {
    // No params · default landing icon
    body = svg({
      element: "WOOD",
      primary: "purupuru",
      secondary: "the awareness layer",
    });
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
