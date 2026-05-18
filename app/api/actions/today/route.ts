// GET /api/actions/today · ambient awareness Blink
// Sprint-1 · S1-T8 · per SDD r2 §4.1.5 + bridgebuilder REFRAME-1 fix
//
// NO interaction · single CTA back to quiz · this IS the awareness moat in action.
//
// v0 default: reads from peripheral-events fixture aggregate (mocked · simulated).
// v0 stretch (S3-T8): SCORE_API_URL set → reads real Score for "aliveness from
// prior collection" (existing PurupuruGenesis Base mints become historical feed).

import { NextResponse } from "next/server";

import { resolveScoreAdapter } from "@purupuru/world-sources";
import { renderAmbient } from "@purupuru/medium-blink";

import { ACTION_CORS_HEADERS, getBaseUrl } from "@/lib/blink/cors";

// Cache the aggregate snapshot for 60s · matches BLINK_DESCRIPTOR cache strategy.
export const revalidate = 60;

const todayElementFromDistribution = (
  dist: Awaited<ReturnType<ReturnType<typeof resolveScoreAdapter>["getElementDistribution"]>>,
): "WOOD" | "FIRE" | "EARTH" | "METAL" | "WATER" => {
  let dominant: keyof typeof dist = "wood";
  let max = -Infinity;
  for (const k of Object.keys(dist) as Array<keyof typeof dist>) {
    if (dist[k] > max) {
      max = dist[k];
      dominant = k;
    }
  }
  // lib/score uses lowercase · translate to canonical uppercase.
  return dominant.toUpperCase() as "WOOD" | "FIRE" | "EARTH" | "METAL" | "WATER";
};

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);
  const score = resolveScoreAdapter();

  try {
    const dist = await score.getElementDistribution();
    const todayElement = todayElementFromDistribution(dist);

    // v0 ambient stats · derived from mock or real Score. Mint count is the
    // sum of distribution entries (matches observatory's ActivityRail mint
    // counter on origin/main). Per-element delta intentionally NOT computed —
    // observatory's KpiStrip exposes `dominant element`, NOT a percent surge,
    // so we don't fabricate a number here that the click-through can't honor.
    const mintCount = Math.round(Object.values(dist).reduce((sum, v) => sum + v, 0));

    const response = renderAmbient({
      todayElement,
      mintCount,
      config: { baseUrl },
    });

    return NextResponse.json(response, { headers: ACTION_CORS_HEADERS });
  } catch (error) {
    // Fail-graceful · serve a static ambient response if Score path fails.
    return NextResponse.json(
      {
        icon: `${baseUrl}/api/og?ambient=fallback`,
        title: "What Element Are You Today?",
        description:
          "The live feed is catching its breath · take the quiz in 90 seconds while we reconnect.",
        label: "Observatory",
        links: {
          actions: [
            {
              type: "post",
              label: "What's My Element?",
              href: `${baseUrl}/api/actions/quiz/start`,
            },
          ],
        },
      },
      { headers: ACTION_CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: ACTION_CORS_HEADERS });
}
