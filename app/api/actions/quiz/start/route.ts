// /api/actions/quiz/start
//   GET  → Q1 ActionGetResponse · the entry-point card
//   POST → chain-link target · returns Q1 inline (when reached from /today's button)
//
// Per Solana Actions spec v2.4 · LinkedAction.type='post' button POSTs to the
// href and expects a PostResponse with `links.next` to drive the chain.

import { NextResponse } from "next/server";

import { renderQuizStart } from "@purupuru/medium-blink";
import type { PostResponse } from "@purupuru/medium-blink";

import { ACTION_CORS_HEADERS, getBaseUrl } from "@/lib/blink/cors";

// Render-time errors (typically: QUIZ_HMAC_KEY env missing) surface clearly
// to ops via server log · user gets a friendly fallback Action response.
function renderErrorAction(baseUrl: string, reason: string) {
  console.error(`[quiz-error] start render failed · ${reason}`);
  return {
    icon: `${baseUrl}/api/og?step=1`,
    title: "Catching our breath",
    description: "The quiz is briefly out of reach · please try again in a moment.",
    label: "retry",
    links: {
      actions: [
        {
          type: "post",
          label: "Try Again",
          href: `${baseUrl}/api/actions/quiz/start`,
        },
      ],
    },
    error: { message: "Quiz render failed · check server logs" },
  };
}

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);
  try {
    const response = renderQuizStart({ baseUrl });
    return NextResponse.json(response, { headers: ACTION_CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      renderErrorAction(baseUrl, err instanceof Error ? err.message : "unknown"),
      { headers: ACTION_CORS_HEADERS, status: 500 },
    );
  }
}

// POST handler · enables `/today` ambient card's "what's my element?" button
// (type="post") to chain into Q1 inline without leaving the card.
export async function POST(request: Request) {
  const baseUrl = getBaseUrl(request);
  try {
    const response: PostResponse = {
      type: "post",
      links: {
        next: {
          type: "inline",
          action: renderQuizStart({ baseUrl }),
        },
      },
    };
    return NextResponse.json(response, { headers: ACTION_CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      renderErrorAction(baseUrl, err instanceof Error ? err.message : "unknown"),
      { headers: ACTION_CORS_HEADERS, status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: ACTION_CORS_HEADERS });
}
