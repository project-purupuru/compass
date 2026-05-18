// /api/actions/quiz/step?step=N&a1=...&aN-1=...&mac=...
//   GET  → ActionGetResponse for step N (mid-quiz card render)
//   POST → PostResponse with links.next.action = inline next step
//
// Per Solana Actions spec v2.4 · button.type="post" → POST handler returns
// PostResponse with embedded next action · Dialect renders inline (no new fetch).
// This is what makes the quiz chain CLICKABLE in real Blink renderers.

import { NextResponse } from "next/server";

import { verifyQuizState, type Answer } from "@purupuru/peripheral-events";
import {
  QUIZ_CONFIG,
  QUIZ_CORPUS,
  renderQuizStep,
  type ActionGetResponse,
  type PostResponse,
} from "@purupuru/medium-blink";

import { ACTION_CORS_HEADERS, getBaseUrl } from "@/lib/blink/cors";

// Validate URL query · returns parsed state OR NextResponse error.
function parseStepQuery(
  url: URL,
):
  | { ok: true; step: number; priorAnswers: Array<0 | 1 | 2 | 3 | 4>; mac: string }
  | { ok: false; response: ReturnType<typeof NextResponse.json> } {
  const params = url.searchParams;
  const baseUrl = `${url.protocol}//${url.host}`;

  // Parse + validate step
  const stepRaw = params.get("step");
  const step = stepRaw ? Number.parseInt(stepRaw, 10) : NaN;
  if (!Number.isInteger(step) || step < 2 || step > QUIZ_CONFIG.totalSteps) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          icon: `${baseUrl}/api/og?step=1`,
          title: "Something's off",
          description: "We lost your place · start again to read you fresh.",
          label: "begin",
          links: {
            actions: [
              {
                type: "post",
                label: "Begin Again",
                href: `${baseUrl}/api/actions/quiz/start`,
              },
            ],
          },
          error: { message: "Invalid step parameter" },
        },
        { headers: ACTION_CORS_HEADERS, status: 400 },
      ),
    };
  }

  // Parse prior answers (a1..aN-1) into typed array. Validate each answer
  // index fits within its question's curated answer count (corpus[i-1].answers.length).
  const priorAnswers: Array<0 | 1 | 2 | 3 | 4> = [];
  for (let i = 1; i < step; i++) {
    const raw = params.get(`a${i}`);
    const ans = raw ? Number.parseInt(raw, 10) : NaN;
    const question = QUIZ_CORPUS[i - 1];
    const maxIdx = question ? question.answers.length - 1 : 0;
    if (!Number.isInteger(ans) || ans < 0 || ans > maxIdx || ans > 4) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: {
              message: `Invalid answer parameter a${i} (must be 0..${maxIdx} for question ${i})`,
            },
          },
          { headers: ACTION_CORS_HEADERS, status: 400 },
        ),
      };
    }
    priorAnswers.push(ans as 0 | 1 | 2 | 3 | 4);
  }

  const mac = params.get("mac") ?? "";

  // Verify HMAC over (step, priorAnswers) · sprint-3 T2 · rejects tampered URLs.
  // signQuizState in the renderer signs the SAME shape so a valid forward
  // step always carries a valid mac · invalid/missing mac → 400.
  const macValid = verifyQuizState({
    step,
    answers: priorAnswers as ReadonlyArray<Answer>,
    mac,
  });
  if (!macValid) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          icon: `${baseUrl}/api/og?step=1`,
          title: "Something's off",
          description: "We lost your place · start again to read you fresh.",
          label: "begin",
          links: {
            actions: [
              {
                type: "post",
                label: "Begin Again",
                href: `${baseUrl}/api/actions/quiz/start`,
              },
            ],
          },
          error: { message: "Quiz state HMAC validation failed" },
        },
        { headers: ACTION_CORS_HEADERS, status: 400 },
      ),
    };
  }

  return { ok: true, step, priorAnswers, mac };
}

// GET → render the step's ActionGetResponse directly.
export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);
  const url = new URL(request.url);
  const parsed = parseStepQuery(url);
  if (!parsed.ok) return parsed.response;

  const response = renderQuizStep({
    step: parsed.step,
    priorAnswers: parsed.priorAnswers,
    mac: parsed.mac,
    config: { baseUrl },
  });
  return NextResponse.json(response, { headers: ACTION_CORS_HEADERS });
}

// POST → wrap step's GET response in PostResponse.links.next.inline so the
// Dialect Blink renderer chains in-card without a fresh fetch round-trip.
export async function POST(request: Request) {
  const baseUrl = getBaseUrl(request);
  const url = new URL(request.url);
  const parsed = parseStepQuery(url);
  if (!parsed.ok) return parsed.response;

  const action: ActionGetResponse = renderQuizStep({
    step: parsed.step,
    priorAnswers: parsed.priorAnswers,
    mac: parsed.mac,
    config: { baseUrl },
  });

  const response: PostResponse = {
    type: "post",
    links: { next: { type: "inline", action } },
  };
  return NextResponse.json(response, { headers: ACTION_CORS_HEADERS });
}

export async function OPTIONS() {
  return new Response(null, { headers: ACTION_CORS_HEADERS });
}
