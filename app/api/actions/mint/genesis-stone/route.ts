// POST /api/actions/mint/genesis-stone · S3-T1 real claim_genesis_stone path
// SDD r2 §4.2 · sprint-3 wiring: replaces sprint-1 mock memo with the real
// two-instruction claim tx (Ed25519Program sig verify + claim_genesis_stone CPI).
//
// Server-side flow:
//   1. Validate POST body (account = wallet pubkey)
//   2. Parse + validate quiz answers from URL query
//   3. Recompute archetype server-side (HIGH-1 · client element ignored)
//   4. Compute weather byte (day-of-week stub · sprint-3 stretch wires real oracle)
//   5. Compute quiz_state_hash from validated answers
//   6. Generate 16-byte nonce · atomic-claim in KV (NX EX 300)
//   7. Load sponsored-payer · check balance ≥ 0.05 SOL
//   8. Load claim-signer secret · build + partial-sign tx via build-claim-tx helper
//   9. Return base64-encoded tx + reveal message per Solana Actions spec
//
// HMAC mac verification on URL state is sprint-3 T2's scope · not enforced here
// at parity with the prior mock-memo route. KV nonce + on-chain expires_at +
// claim-signer pubkey pinning still gate a valid mint.

import { NextResponse } from "next/server";

import { Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { randomBytes } from "node:crypto";

import {
  archetypeFromAnswers,
  QUIZ_COMPLETED_STEP,
  quizStateHashOf,
  verifyQuizState,
  type Answer,
  type ClaimNonce,
  type Element,
  type QuizStateHash,
} from "@purupuru/peripheral-events";
import { ARCHETYPE_REVEALS, QUIZ_CORPUS } from "@purupuru/medium-blink";

import { ACTION_CORS_HEADERS } from "@/lib/blink/cors";
import { checkMintEnv } from "@/lib/blink/env-check";
import { claimNonce } from "@/lib/blink/nonce-store";
import { checkPayerBalance, loadSponsoredPayer } from "@/lib/blink/sponsored-payer";
import { buildClaimGenesisStoneTx } from "@/lib/blink/anchor/build-claim-tx";
import { PublicKey } from "@solana/web3.js";

// Devnet RPC default · override via env for production-grade endpoint (Helius etc).
const DEFAULT_RPC_URL = "https://api.devnet.solana.com";

// Cluster discriminator for ClaimMessage · 0=devnet · 1=mainnet.
const CLUSTER: 0 | 1 = 0;

// Force Node runtime · @coral-xyz/anchor + tweetnacl + node:crypto require it.
export const runtime = "nodejs";

// POST body shape per Solana Actions spec.
interface ActionPostBody {
  account?: string;
}

// Parse answers (a1..a8) from URL query · mirrors result endpoint.
const parseAnswersFromQuery = (url: URL): { answers: Array<0 | 1 | 2 | 3 | 4>; error?: string } => {
  const answers: Array<0 | 1 | 2 | 3 | 4> = [];
  for (let i = 1; i <= 8; i++) {
    const raw = url.searchParams.get(`a${i}`);
    const ans = raw ? Number.parseInt(raw, 10) : NaN;
    if (!Number.isInteger(ans) || ans < 0 || ans > 4) {
      return { answers: [], error: `Invalid answer parameter a${i}` };
    }
    answers.push(ans as 0 | 1 | 2 | 3 | 4);
  }
  return { answers };
};

// Compute today's cosmic weather element · v0 stub keyed off day-of-week.
// Sprint-3 stretch swaps to real puruhpuruweather oracle if time permits.
const todayWeatherElement = (): Element => {
  const day = new Date().getUTCDay();
  const cycle: Element[] = ["WOOD", "FIRE", "EARTH", "METAL", "WATER"];
  const idx = day % 5;
  return cycle[idx] ?? "WOOD";
};

// Map answers to their element votes via the quiz corpus.
const elementVotesFromAnswers = (answers: ReadonlyArray<0 | 1 | 2 | 3 | 4>): Element[] =>
  answers.map((idx, qIdx) => {
    const question = QUIZ_CORPUS[qIdx];
    const answer = question?.answers[idx];
    if (!answer) {
      throw new Error(`Quiz answer ${idx} not in step ${qIdx + 1}`);
    }
    return answer.element;
  });

// Generate a 16-byte hex nonce · UUID-equivalent collapsed to hex string form.
const freshNonce = (): ClaimNonce => randomBytes(16).toString("hex") as ClaimNonce;

// Wrapper to keep the response shape uniform.
const errorResponse = (message: string, status: number, detail?: string): NextResponse =>
  NextResponse.json(
    {
      transaction: "",
      message,
      ...(detail !== undefined ? { error: { message: detail } } : {}),
    },
    { headers: ACTION_CORS_HEADERS, status },
  );

export async function POST(request: Request) {
  // 0. Env preflight · surface ALL missing config in one error rather than
  // failing piecemeal further down. Logs to server but never echoes values.
  const envCheck = checkMintEnv();
  if (!envCheck.ok) {
    console.error("[mint-error] env preflight failed\n" + envCheck.formatted);
    return errorResponse(
      "Configuration's off · please try again later.",
      500,
      "Mint-flow env not ready · check server logs",
    );
  }

  // 1. Parse + validate POST body · `account` is the wallet's public key.
  let body: ActionPostBody;
  try {
    body = (await request.json()) as ActionPostBody;
  } catch {
    return errorResponse("Invalid request shape.", 400, "Invalid JSON body");
  }

  const account = body.account;
  if (!account || typeof account !== "string" || account.length < 32) {
    return errorResponse(
      "Couldn't read your wallet · please reconnect.",
      400,
      "Missing or malformed `account` field",
    );
  }

  let authority: PublicKey;
  try {
    authority = new PublicKey(account);
  } catch {
    return errorResponse(
      "Couldn't read your wallet · please reconnect.",
      400,
      "Account is not a valid Solana pubkey",
    );
  }

  // 2. Recover quiz answers from URL query (the result button carries them through).
  const url = new URL(request.url);
  const { answers, error } = parseAnswersFromQuery(url);
  if (error) {
    return errorResponse("We couldn't read your answers · please take the quiz again.", 400, error);
  }

  // 2.5 Verify HMAC over (step=9, answers) · rejects tampered claim URLs.
  // The renderer signs this shape on the final question's button + threads
  // the same mac through /result → claim button. Mint route trusts the chain
  // integrity by verifying the same canonical state.
  const mac = url.searchParams.get("mac") ?? "";
  const macValid = verifyQuizState({
    step: QUIZ_COMPLETED_STEP,
    answers: answers as ReadonlyArray<Answer>,
    mac,
  });
  if (!macValid) {
    console.warn("[mint-error] HMAC validation failed · tampered URL?");
    return errorResponse(
      "Quiz state didn't check out · please take the quiz again.",
      400,
      "Quiz state HMAC validation failed",
    );
  }

  // 3. Recompute archetype server-side (HIGH-1 · client-supplied element ignored).
  const elementVotes = elementVotesFromAnswers(answers);
  const archetype = archetypeFromAnswers(elementVotes);
  const weather = todayWeatherElement();

  // 4. Hash validated answers for ClaimMessage.quiz_state_hash binding.
  const quizStateHash = quizStateHashOf(answers as ReadonlyArray<0 | 1 | 2 | 3>) as QuizStateHash;

  // 5. Generate fresh nonce · atomically claim in KV (replay protection).
  const nonce = freshNonce();
  const nonceResult = await claimNonce(nonce);
  if (nonceResult === "kv-down") {
    return errorResponse(
      "Network's briefly out of reach · please try again.",
      503,
      "KV unreachable",
    );
  }
  if (nonceResult === "replay") {
    return errorResponse("Already claimed · check your wallet.", 409, "Nonce already consumed");
  }

  // 6. Load sponsored-payer · check balance gate.
  let sponsoredPayer;
  try {
    sponsoredPayer = loadSponsoredPayer();
  } catch (err) {
    console.error("[mint-error] sponsored-payer load failed", err);
    return errorResponse(
      "Configuration's off · please try again later.",
      500,
      err instanceof Error ? err.message : "sponsored-payer load failed",
    );
  }

  const rpcUrl = process.env.SOLANA_RPC_URL ?? DEFAULT_RPC_URL;
  const connection = new Connection(rpcUrl, "confirmed");

  const balance = await checkPayerBalance(connection, sponsoredPayer.publicKey);
  if (!balance.canSponsor) {
    console.error(`[mint-error] sponsored-payer balance below threshold · ${balance.sol} SOL`);
    return errorResponse(
      "Network's briefly out of reach · please try again.",
      503,
      `Sponsored-payer balance insufficient: ${balance.sol} SOL`,
    );
  }

  // 7. Load claim-signer secret from env.
  const claimSignerBs58 = process.env.CLAIM_SIGNER_SECRET_BS58;
  if (!claimSignerBs58) {
    console.error("[mint-error] CLAIM_SIGNER_SECRET_BS58 not set");
    return errorResponse(
      "Configuration's off · please try again later.",
      500,
      "CLAIM_SIGNER_SECRET_BS58 missing",
    );
  }
  const claimSignerSecret = bs58.decode(claimSignerBs58);

  // 8. Build the partially-signed claim tx.
  let txResult;
  try {
    txResult = await buildClaimGenesisStoneTx({
      connection,
      sponsoredPayer,
      claimSignerSecret,
      authority,
      archetype,
      weather,
      quizStateHash,
      nonce,
      cluster: CLUSTER,
    });
  } catch (err) {
    console.error("[mint-error] tx assembly failed", err);
    return errorResponse(
      "Couldn't prepare the claim · please try again.",
      500,
      err instanceof Error ? err.message : "tx assembly failed",
    );
  }

  console.log(
    `[mint-success] archetype=${archetype} weather=${weather} ` +
      `mint=${txResult.mintPubkey} authority=${authority.toBase58()} ` +
      `expires_at=${txResult.expiresAt}`,
  );

  // 9. Compose reveal acknowledgment · presentation-translated.
  const reveal = ARCHETYPE_REVEALS[archetype] ?? "Your stone is yours.";

  // 10. Loop-closure bridge · post-mint links.next points at the Observatory
  // with ?welcome={element} query param. The observatory page reads this and
  // plays the Stone Recognition Ceremony.
  //
  // BUG FIX 2026-05-11 (#bug-91e298): button type changed from
  //   "external-link" → "inline-link"
  // because @dialectlabs/blinks-core@0.20.7's runAction handler at
  //   blinks-core/dist/index.js:308
  // special-cases ONLY `component.type === "inline-link"` to return a
  // navigate-without-POST directive. `external-link` at the
  // component-level falls through to line 323+ which POSTs to the
  // button's href — for us that meant POSTing to purupuru.world/?welcome=fire
  // (a Next.js page, not an action endpoint), the renderer parsed the
  // HTML response as a transaction, and signTransaction was called
  // with garbage producing the "Signing failed." message Gumi saw
  // demoing from X.
  //
  // `inline-link` per spec: renders as <a href> when execution status
  // is idle/blocked, and at runtime returns the external-link
  // directive immediately on click. No POST. No signing. Just navigate.
  const OBSERVATORY_URL = process.env.OBSERVATORY_URL ?? "https://purupuru.world";
  const welcomeUrl = `${OBSERVATORY_URL}/?welcome=${archetype.toLowerCase()}`;

  return NextResponse.json(
    {
      transaction: txResult.base64Tx,
      message: reveal,
      links: {
        next: {
          type: "inline",
          action: {
            icon: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://purupuru.world"}/art/stones/${archetype.toLowerCase()}.png`,
            title: `Your ${archetype.charAt(0) + archetype.slice(1).toLowerCase()} stone is in the world.`,
            description: "Eight answers became one element. The stone is yours to keep.",
            label: "See yourself in the world",
            links: {
              actions: [
                {
                  type: "inline-link",
                  label: "See yourself in the world",
                  href: welcomeUrl,
                },
              ],
            },
          },
        },
      },
    },
    { headers: ACTION_CORS_HEADERS },
  );
}

// GET handler · helps dialect inspector preview the action surface before POST.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  return NextResponse.json(
    {
      icon: `${baseUrl}/api/og?action=mint`,
      title: "Claim your stone.",
      description: "Eight answers became one element. The stone is yours to keep.",
      label: "claim",
      links: {
        actions: [
          {
            type: "post",
            label: "Take the Quiz",
            href: `${baseUrl}/api/actions/quiz/start`,
          },
        ],
      },
    },
    { headers: ACTION_CORS_HEADERS },
  );
}

export async function OPTIONS() {
  return new Response(null, { headers: ACTION_CORS_HEADERS });
}
