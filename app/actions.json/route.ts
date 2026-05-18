// /actions.json · Solana Actions registry mapping
// Per https://solana.com/docs/advanced/actions#actionsjson
//
// Tells action clients (dial.to · Phantom · @dialectlabs/blinks) how to
// resolve URLs to API action endpoints. Without this, Dialect's "unfurl"
// step requests /actions.json, gets HTML 404, and emits the
// "Unexpected token <" error · then refuses to render any Blink.
//
// Our rules · all paths under /api/actions/** map directly to themselves
// (the URL IS the action endpoint · no website-to-action indirection).

import { NextResponse } from "next/server";

import { ACTION_CORS_HEADERS } from "@/lib/blink/cors";

const ACTIONS_MANIFEST = {
  rules: [
    // Direct passthrough · /api/actions/x → /api/actions/x
    {
      pathPattern: "/api/actions/**",
      apiPath: "/api/actions/**",
    },
    // Quiz entry · /quiz → /api/actions/quiz/start (friendly URL)
    {
      pathPattern: "/quiz",
      apiPath: "/api/actions/quiz/start",
    },
    // Today ambient · /today → /api/actions/today
    {
      pathPattern: "/today",
      apiPath: "/api/actions/today",
    },
  ],
} as const;

export async function GET() {
  return NextResponse.json(ACTIONS_MANIFEST, {
    headers: ACTION_CORS_HEADERS,
  });
}

export async function OPTIONS() {
  return new Response(null, { headers: ACTION_CORS_HEADERS });
}
